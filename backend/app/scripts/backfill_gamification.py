"""
게이미피케이션 도입 이전에 쌓인 핀·인증 기록에 포인트와 뱃지를 소급 적용합니다.

이미 적립된 건은 (user_id, reason, pin_id, verification_id) 조합으로 건너뛰므로
여러 번 실행해도 중복 지급되지 않습니다.
users.points는 적립 내역의 합계로 다시 계산합니다.

사용법:  python -m app.scripts.backfill_gamification
"""
import sys
import os

# Add backend directory to sys.path to support direct script execution
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from app.models import Pin, User, Verification
from app.repositories import PointRepository
from app.services.gamification_service import (
    POINT_REASONS,
    REASON_PIN_CREATE,
    REASON_PIN_CREATE_VALIDATED,
    REASON_PIN_VERIFIED_BY_OTHER,
    REASON_VERIFY,
    REASON_VERIFY_VALIDATED,
    GamificationService,
)

# 같은 사건에 대한 변형끼리는 하나만 지급되어야 합니다. (검증 성공/실패 버전)
REASON_VARIANTS = {
    REASON_PIN_CREATE: (REASON_PIN_CREATE, REASON_PIN_CREATE_VALIDATED),
    REASON_PIN_CREATE_VALIDATED: (REASON_PIN_CREATE, REASON_PIN_CREATE_VALIDATED),
    REASON_VERIFY: (REASON_VERIFY, REASON_VERIFY_VALIDATED),
    REASON_VERIFY_VALIDATED: (REASON_VERIFY, REASON_VERIFY_VALIDATED),
    REASON_PIN_VERIFIED_BY_OTHER: (REASON_PIN_VERIFIED_BY_OTHER,),
}


def main():
    db = SessionLocal()
    points_repo = PointRepository()
    service = GamificationService()

    granted_points = 0
    pin_rows, verification_rows, owner_rows = 0, 0, 0

    try:
        existing = points_repo.existing_keys(db)

        def grant(user_id: int, reason_code: str, pin_id: int | None, verification_id: int | None) -> bool:
            """이미 같은 사건으로 적립된 적이 없을 때만 적립합니다."""
            nonlocal granted_points
            for variant in REASON_VARIANTS[reason_code]:
                if (user_id, variant, pin_id, verification_id) in existing:
                    return False

            reason = POINT_REASONS[reason_code]
            points_repo.create(
                db,
                {
                    "user_id": user_id,
                    "amount": reason.amount,
                    "reason": reason.code,
                    "pin_id": pin_id,
                    "verification_id": verification_id,
                },
            )
            existing.add((user_id, reason_code, pin_id, verification_id))
            granted_points += reason.amount
            return True

        # 1) 핀 등록 보상
        for pin in db.query(Pin).order_by(Pin.id).all():
            validated = any(photo.is_validated for photo in pin.photos)
            reason_code = REASON_PIN_CREATE_VALIDATED if validated else REASON_PIN_CREATE
            if grant(pin.user_id, reason_code, pin.id, None):
                pin_rows += 1

        # 2) 방문 인증 보상 (인증자 + 핀 등록자)
        for verification in db.query(Verification).order_by(Verification.id).all():
            reason_code = REASON_VERIFY_VALIDATED if verification.is_validated else REASON_VERIFY
            if grant(verification.user_id, reason_code, verification.pin_id, verification.id):
                verification_rows += 1

            pin = verification.pin
            if pin and verification.is_still_there and pin.user_id != verification.user_id:
                if grant(pin.user_id, REASON_PIN_VERIFIED_BY_OTHER, pin.id, verification.id):
                    owner_rows += 1

        db.flush()

        # 3) 누적 포인트/레벨을 적립 내역 합계로 재계산하고 뱃지를 판정합니다.
        badges_awarded = 0
        users = db.query(User).order_by(User.id).all()
        for user in users:
            user.points = points_repo.sum_by_user(db, user.id)
            user.level = service.level_of(user.points)
            badges_awarded += len(service.evaluate_badges(db, user.id))

        db.commit()

        print("게이미피케이션 소급 적용 완료")
        print(f"  users: {len(users)}")
        print(f"  핀 등록 보상: {pin_rows}건")
        print(f"  방문 인증 보상: {verification_rows}건")
        print(f"  핀 등록자 보상: {owner_rows}건")
        print(f"  지급 포인트 합계: {granted_points} P")
        print(f"  신규 지급 뱃지: {badges_awarded}개")
    finally:
        db.close()


if __name__ == "__main__":
    main()
