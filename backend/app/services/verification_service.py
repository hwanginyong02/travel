import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Pin, Verification
from app.repositories import VerificationRepository
from app.services.exif_service import BLURRED_PIN_EXTRA_RADIUS_M, EXIF_MATCH_RADIUS_M, ExifService
from app.services.storage_service import save_image

logger = logging.getLogger(__name__)

VERIFICATION_PHOTO_SUBDIR = "verifications"

# 신뢰도 가중치
SCORE_REGISTERED_PHOTO_VALIDATED = 1   # 등록 사진이 EXIF 검증된 핀의 기본 점수
SCORE_STILL_THERE_VALIDATED = 2        # 현장 사진까지 검증된 '그대로예요'
SCORE_STILL_THERE = 1                  # 사진 없거나 미검증인 '그대로예요'
SCORE_NOT_THERE = -2                   # '없어졌어요' — 부정 신호를 무겁게 반영


class VerificationError(Exception):
    """인증 규칙 위반. 라우터가 HTTP 상태 코드로 변환합니다."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def calculate_reliability(pin: Pin) -> int:
    """
    핀의 신뢰도를 인증 기록 전체로부터 다시 계산합니다.
    증분 갱신 대신 매번 전체를 재계산해 중복 반영이나 점수 드리프트를 차단합니다.
    """
    score = SCORE_REGISTERED_PHOTO_VALIDATED if any(p.is_validated for p in pin.photos) else 0

    for verification in pin.verifications:
        if not verification.is_still_there:
            score += SCORE_NOT_THERE
        elif verification.is_validated:
            score += SCORE_STILL_THERE_VALIDATED
        else:
            score += SCORE_STILL_THERE

    return score


class VerificationService:
    """
    방문 인증의 비즈니스 로직을 담당합니다.
    인증 사진의 EXIF 검증, 신뢰도 재계산, 최종 확인 일시 갱신을 수행하며
    HTTP 요청/응답 형태는 알지 못합니다.
    """

    def __init__(self):
        self.repo = VerificationRepository()
        self.exif_service = ExifService()

    def match_radius_for(self, pin: Pin) -> float:
        """
        좌표가 흐려진 핀은 저장된 좌표 자체가 최대 수백 m 이동해 있으므로
        블러 격자만큼 기준 반경을 넓혀 정상 방문자가 실패하지 않게 합니다.
        """
        if pin.is_blurred:
            return EXIF_MATCH_RADIUS_M + BLURRED_PIN_EXTRA_RADIUS_M
        return EXIF_MATCH_RADIUS_M

    def create_verification(
        self,
        db: Session,
        user_id: int,
        pin: Pin,
        is_still_there: bool,
        image_bytes: bytes | None = None,
        image_filename: str | None = None,
    ) -> tuple[Verification, int, bool, str]:
        """
        방문 인증 한 건을 등록합니다.
        반환값은 (인증 기록, 갱신된 신뢰도, 사진 검증 성공 여부, 안내 메시지).
        """
        if pin.user_id == user_id:
            raise VerificationError("self_verification", "본인이 등록한 핀은 인증할 수 없습니다.")

        if self.repo.exists_by_user_and_pin(db, user_id, pin.id):
            raise VerificationError("already_verified", "이미 이 핀을 인증하셨습니다.")

        photo_url = None
        photo_validated = False
        messages = []

        if image_bytes:
            exif_result = self.exif_service.verify(
                image_bytes, pin.latitude, pin.longitude, radius_m=self.match_radius_for(pin)
            )
            photo_validated = exif_result.is_validated
            photo_url = save_image(image_bytes, image_filename or "", VERIFICATION_PHOTO_SUBDIR)
            messages.append(exif_result.message)

        verification = self.repo.create(
            db,
            {
                "pin_id": pin.id,
                "user_id": user_id,
                "photo_url": photo_url,
                "is_still_there": is_still_there,
                "is_validated": photo_validated,
            },
        )

        # 방금 만든 인증까지 반영해 점수를 다시 계산합니다.
        db.refresh(pin)
        pin.reliability_score = calculate_reliability(pin)
        pin.last_status_checked_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(verification)
        db.refresh(pin)

        messages.append(self._summary_message(is_still_there, photo_validated))

        return verification, pin.reliability_score, photo_validated, " ".join(messages)

    def _summary_message(self, is_still_there: bool, photo_validated: bool) -> str:
        if not is_still_there:
            return "'없어졌어요' 응답이 반영되어 이 핀의 신뢰도가 낮아졌습니다."
        if photo_validated:
            return "현장 사진까지 확인되어 신뢰도가 크게 올랐습니다. 감사합니다!"
        return "인증이 반영되어 신뢰도가 올랐습니다. 감사합니다!"
