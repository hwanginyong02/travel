import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Pin, User, Verification
from app.repositories import VerificationRepository
from app.services.exif_service import (
    BLURRED_PIN_EXTRA_RADIUS_M,
    EXIF_MATCH_RADIUS_M,
    PHOTO_MAX_AGE_DAYS,
    ExifService,
)
from app.services.gamification_service import GamificationService, Reward
from app.services.storage_service import save_image

logger = logging.getLogger(__name__)

VERIFICATION_PHOTO_SUBDIR = "verifications"

# 신뢰도 가중치
SCORE_REGISTERED_PHOTO_VALIDATED = 1   # 등록 사진이 EXIF 검증된 핀의 기본 점수
SCORE_STILL_THERE_VALIDATED = 2        # 현장 사진까지 검증된 '그대로예요'
SCORE_NOT_THERE = -2                   # '없어졌어요' — 부정 신호를 무겁게 반영


@dataclass
class VerificationResult:
    """방문 인증 결과. 갱신된 신뢰도와 게이미피케이션 보상을 함께 담습니다."""
    verification: Verification
    reliability_score: int
    photo_validated: bool
    message: str
    reward: Reward


class VerificationError(Exception):
    """인증 규칙 위반. 라우터가 HTTP 상태 코드로 변환합니다."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def calculate_reliability(pin: Pin) -> int:
    """
    핀의 신뢰도를 인증 비율(0~100점 만점)로 계산합니다.
    - 100점 만점: (그대로예요 응답 수 / 전체 인증 수) * 100
    - 예: 31명 중 31명이 그대로예요 -> 100점
    - 예: 31명 중 0명이 그대로예요 -> 0점
    - 인증 내역이 없는 신규 핀: 기본 100점
    """
    total = len(pin.verifications)
    if total == 0:
        return 100

    still_there = sum(1 for v in pin.verifications if v.is_still_there)
    return round((still_there / total) * 100)



import math

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """두 위경도 좌표 사이의 대권 거리를 미터(m) 단위로 계산합니다."""
    R = 6371000.0  # 지구 반지름 (미터)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class VerificationService:
    """
    방문 인증의 비즈니스 로직을 담당합니다.
    인증 사진의 EXIF 검증, 기기 GPS 위치 검증, 신뢰도 재계산, 최종 확인 일시 갱신을 수행합니다.
    """

    def __init__(self):
        self.repo = VerificationRepository()
        self.exif_service = ExifService()
        self.gamification = GamificationService()

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
        user: User,
        pin: Pin,
        is_still_there: bool,
        image_bytes: bytes | None = None,
        image_filename: str | None = None,
        user_latitude: float | None = None,
        user_longitude: float | None = None,
    ) -> VerificationResult:
        """방문 인증 한 건을 등록하고, 인증자와 핀 등록자에게 보상을 지급합니다."""
        user_id = user.id

        if pin.user_id == user_id:
            raise VerificationError("self_verification", "본인이 등록한 핀은 인증할 수 없습니다.")

        if self.repo.exists_by_user_and_pin(db, user_id, pin.id):
            raise VerificationError("already_verified", "이미 이 핀을 인증하셨습니다.")

        photo_url = None
        photo_validated = False
        gps_validated = False
        photo_taken_at = None
        messages = []

        # 1. 기기 실시간 GPS 위치 검증
        max_radius = self.match_radius_for(pin)
        if user_latitude is not None and user_longitude is not None:
            dist = haversine_distance_m(user_latitude, user_longitude, pin.latitude, pin.longitude)
            if dist <= max_radius:
                gps_validated = True
                messages.append(f"📍 실시간 현장 GPS 방문이 확인되었습니다. (거리: {int(dist)}m)")
            else:
                messages.append(f"📍 실시간 GPS 오차 범위(약 {int(dist)}m 떨어진 위치)로 측정되었습니다.")

        # 2. 사진 EXIF 좌표 검증
        if image_bytes:
            exif_result = self.exif_service.verify(
                image_bytes, pin.latitude, pin.longitude, radius_m=max_radius
            )
            photo_validated = exif_result.is_validated
            photo_taken_at = exif_result.taken_at
            photo_url = save_image(image_bytes, image_filename or "", VERIFICATION_PHOTO_SUBDIR)
            messages.append(exif_result.message)

        # GPS 위치 검증 성공 혹은 EXIF 검증 성공 시 최종 검증 성공 판정
        is_validated = photo_validated or gps_validated

        if not image_bytes and not gps_validated:
            messages.append("현장 GPS 또는 검증된 현장 사진이 확인되지 않았습니다.")

        verification = self.repo.create(
            db,
            {
                "pin_id": pin.id,
                "user_id": user_id,
                "photo_url": photo_url,
                "is_still_there": is_still_there,
                "is_validated": is_validated,
                "exif_taken_at": photo_taken_at,
            },
        )

        # 방금 만든 인증까지 반영해 점수를 다시 계산합니다.
        db.refresh(pin)
        pin.reliability_score = calculate_reliability(pin)
        pin.last_status_checked_at = datetime.now(timezone.utc)

        reward = (
            self.gamification.award_verification(
                db,
                user=user,
                pin=pin,
                verification_id=verification.id,
                is_still_there=is_still_there,
            )
            if is_validated
            else Reward(total_points=user.points or 0, level=user.level or 1)
        )

        db.commit()
        db.refresh(verification)
        db.refresh(pin)

        messages.append(self._summary_message(is_still_there, is_validated))

        return VerificationResult(
            verification=verification,
            reliability_score=pin.reliability_score,
            photo_validated=is_validated,
            message=" ".join(messages),
            reward=reward,
        )


    def _summary_message(self, is_still_there: bool, photo_validated: bool) -> str:
        if not photo_validated:
            return (
                "인증 기록은 남았지만, 검증된 현장 사진이 없어 신뢰도와 포인트에는 반영되지 않았습니다. "
                f"최근 {PHOTO_MAX_AGE_DAYS}일 이내에 현장에서 찍은 원본 사진을 첨부해주세요."
            )
        if not is_still_there:
            return "'없어졌어요' 응답이 반영되어 이 핀의 신뢰도가 낮아졌습니다."
        return "현장 사진까지 확인되어 신뢰도가 올랐습니다. 감사합니다!"
