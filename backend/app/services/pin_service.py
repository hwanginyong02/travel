import logging
from dataclasses import dataclass
from datetime import datetime
from math import floor

from sqlalchemy.orm import Session

from app.models import Pin, Tag, TourSpot, User
from app.repositories import PinRepository
from app.services.exif_service import (
    PHOTO_MAX_AGE_DAYS,
    SPOT_MATCH_RADIUS_M,
    ExifResult,
    ExifService,
    format_distance,
)
from app.services.gamification_service import GamificationService, Reward
from app.services.storage_service import (
    ALLOWED_IMAGE_TYPES,
    MAX_PHOTO_BYTES,
    PUBLIC_UPLOAD_PREFIX,
    UPLOAD_ROOT,
    save_image,
)

logger = logging.getLogger(__name__)

PIN_PHOTO_SUBDIR = "pins"
PIN_PHOTO_DIR = UPLOAD_ROOT / PIN_PHOTO_SUBDIR

__all__ = [
    "PinService",
    "PinCreateResult",
    "PinError",
    "ALLOWED_IMAGE_TYPES",
    "MAX_PHOTO_BYTES",
    "PUBLIC_UPLOAD_PREFIX",
    "UPLOAD_ROOT",
    "PIN_PHOTO_DIR",
    "DANGER_KEYWORD_TAGS",
]

# 위험 지점 키워드 → 자동으로 붙는 주의 태그 이름
DANGER_KEYWORD_TAGS = {
    "절벽": "낙상주의",
    "벼랑": "낙상주의",
    "계곡": "수심주의",
    "폭포": "수심주의",
    "급류": "수심주의",
    "바위": "미끄럼주의",
    "암벽": "미끄럼주의",
    "가파": "급경사주의",
    "경사": "급경사주의",
    "갯벌": "조수주의",
    "해식": "조수주의",
}

# 환경 민감 지역 키워드 → 좌표를 흐리게 표기
SENSITIVE_KEYWORDS = ("멸종", "천연기념물", "생태보호", "습지", "철새", "군락지", "보호구역")

# 좌표 블러 격자 크기(도). 위도 1도 ≈ 111km 이므로 0.0045도 ≈ 약 500m
BLUR_GRID_DEGREES = 0.0045


class PinError(Exception):
    """핀 등록 규칙 위반. 라우터가 HTTP 상태 코드로 변환합니다."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class PinCreateResult:
    """핀 등록 결과. 검증 결과와 게이미피케이션 보상을 함께 담습니다."""
    pin: Pin
    exif_validated: bool
    message: str
    reward: Reward
    photo_taken_at: datetime | None = None
    is_photo_recent: bool = False


class PinService:
    """
    핀 등록의 비즈니스 로직을 담당합니다.
    사진 저장, EXIF 검증 위임, 주의 태그 자동 부착, 민감 지역 좌표 블러 처리를 수행하며
    HTTP 요청/응답 형태는 알지 못합니다.
    """

    def __init__(self):
        self.repo = PinRepository()
        self.exif_service = ExifService()
        self.gamification = GamificationService()

    # ---------- 좌표 / 태그 정책 ----------

    def is_sensitive_area(self, title: str, description: str, tag_names: list[str]) -> bool:
        haystack = " ".join([title or "", description or "", " ".join(tag_names)])
        return any(keyword in haystack for keyword in SENSITIVE_KEYWORDS)

    def blur_coordinate(self, latitude: float, longitude: float) -> tuple[float, float]:
        """민감 지역 좌표를 약 500m 격자의 중심으로 스냅해 정밀도를 낮춥니다."""
        def snap(value: float) -> float:
            return round(floor(value / BLUR_GRID_DEGREES) * BLUR_GRID_DEGREES + BLUR_GRID_DEGREES / 2, 6)

        return snap(latitude), snap(longitude)

    def resolve_danger_tag_names(self, title: str, description: str) -> list[str]:
        """제목/설명에 위험 지형 키워드가 있으면 붙일 주의 태그 이름을 반환합니다."""
        haystack = f"{title or ''} {description or ''}"
        names = []
        for keyword, tag_name in DANGER_KEYWORD_TAGS.items():
            if keyword in haystack and tag_name not in names:
                names.append(tag_name)
        return names

    def _build_tags(self, db: Session, requested: list[str], title: str, description: str) -> list[Tag]:
        tags = self.repo.get_or_create_tags(db, requested)

        danger_names = self.resolve_danger_tag_names(title, description)
        existing_names = {tag.name for tag in tags}
        for name in danger_names:
            if name in existing_names:
                continue
            danger_tag = self.repo.get_or_create_tags(db, [name])[0]
            danger_tag.is_danger = True
            tags.append(danger_tag)
            existing_names.add(name)

        return tags

    # ---------- 사진 저장 ----------

    def save_photo_file(self, image_bytes: bytes, filename: str) -> str:
        """핀 사진을 저장하고 공개 URL 경로를 반환합니다."""
        return save_image(image_bytes, filename, PIN_PHOTO_SUBDIR)

    # ---------- EXIF 검사 ----------

    def inspect_photo(self, image_bytes: bytes, tour_spot: TourSpot) -> ExifResult:
        """
        사진이 이 명소의 핀으로 등록될 수 있는지 EXIF로 확인합니다.
        등록 전 미리보기와 실제 등록이 같은 판정을 쓰도록 한 곳에 모아둡니다.
        """
        return self.exif_service.verify(
            image_bytes,
            tour_spot.mapy,   # 위도
            tour_spot.mapx,   # 경도
            radius_m=SPOT_MATCH_RADIUS_M,
            max_age_days=PHOTO_MAX_AGE_DAYS,
        )

    def ensure_registrable(self, exif_result: ExifResult, tour_spot: TourSpot) -> None:
        """
        핀 좌표로 삼을 수 없는 사진을 걸러냅니다.

        핀 좌표는 EXIF 좌표를 그대로 쓰므로, GPS가 없으면 좌표를 만들 방법이 없습니다.
        업로드 시점의 기기 위치로 대신하면 집에서 올린 핀에 집 좌표가 박히기 때문에
        폴백을 두지 않고 거부합니다.
        촬영 시각이 오래된 사진은 거부하지 않고 보상만 낮춥니다.
        """
        if not exif_result.has_gps:
            raise PinError(
                "no_gps",
                "사진에 위치 정보(GPS)가 없어 핀을 등록할 수 없습니다. "
                "촬영 원본 사진을 올리거나, 카메라의 위치 기록 설정을 켜고 다시 촬영해주세요.",
            )

        if not self._has_usable_coordinates(tour_spot):
            # 명소 좌표가 비어 있으면 비교 자체가 무의미하므로 통과시킵니다.
            return

        if not exif_result.within_radius:
            raise PinError(
                "spot_mismatch",
                f"사진의 촬영 위치가 '{tour_spot.title}'에서 "
                f"{format_distance(exif_result.distance_m)} 떨어져 있습니다. "
                "다른 명소를 선택했는지 확인해주세요.",
            )

    def _has_usable_coordinates(self, tour_spot: TourSpot) -> bool:
        """동기화가 덜 된 명소는 좌표가 0이거나 범위를 벗어나 있을 수 있습니다."""
        lat, lng = tour_spot.mapy, tour_spot.mapx
        if not lat or not lng:
            return False
        return -90 <= lat <= 90 and -180 <= lng <= 180

    # ---------- 핀 등록 ----------

    def create_pin(
        self,
        db: Session,
        user: User,
        tour_spot: TourSpot,
        title: str,
        description: str,
        tag_names: list[str],
        image_bytes: bytes,
        image_filename: str,
    ) -> PinCreateResult:
        """
        핀 하나를 등록하고 등록 보상을 지급합니다.

        핀 좌표는 사진의 EXIF 좌표를 그대로 씁니다. 업로드 시점의 기기 위치가 아니라
        '사진을 찍은 그 자리'가 곧 숨은 좌표이기 때문입니다.
        민감 지역이면 그 좌표를 흐리게 처리해 저장합니다.
        """
        exif_result = self.inspect_photo(image_bytes, tour_spot)
        self.ensure_registrable(exif_result, tour_spot)

        latitude, longitude = exif_result.latitude, exif_result.longitude

        is_blurred = self.is_sensitive_area(title, description, tag_names)
        stored_lat, stored_lng = (
            self.blur_coordinate(latitude, longitude) if is_blurred else (latitude, longitude)
        )

        tags = self._build_tags(db, tag_names, title, description)

        pin = self.repo.create(
            db,
            {
                "tour_spot_id": tour_spot.id,
                "user_id": user.id,
                "title": title,
                "description": description,
                "latitude": stored_lat,
                "longitude": stored_lng,
                "is_blurred": is_blurred,
                "reliability_score": 1 if exif_result.is_validated else 0,
            },
            tags,
        )

        photo_url = self.save_photo_file(image_bytes, image_filename)
        self.repo.add_photo(
            db,
            {
                "pin_id": pin.id,
                "photo_url": photo_url,
                "exif_latitude": exif_result.latitude,
                "exif_longitude": exif_result.longitude,
                "exif_taken_at": exif_result.taken_at,
                "is_validated": exif_result.is_validated,
            },
        )

        # 포인트/뱃지는 핀과 같은 트랜잭션에서 지급해 둘 중 하나만 남는 일이 없게 합니다.
        reward = self.gamification.award_pin_created(db, user, pin, exif_result.is_validated)

        db.commit()
        db.refresh(pin)

        message = exif_result.message
        if is_blurred:
            message += " 환경 민감 지역으로 판단되어 좌표를 약 500m 단위로 흐리게 표기합니다."

        return PinCreateResult(
            pin=pin,
            exif_validated=exif_result.is_validated,
            message=message,
            reward=reward,
            photo_taken_at=exif_result.taken_at,
            is_photo_recent=exif_result.is_recent,
        )
