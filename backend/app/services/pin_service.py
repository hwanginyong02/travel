import logging
from math import floor

from sqlalchemy.orm import Session

from app.models import Pin, Tag
from app.repositories import PinRepository
from app.services.exif_service import ExifService
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


class PinService:
    """
    핀 등록의 비즈니스 로직을 담당합니다.
    사진 저장, EXIF 검증 위임, 주의 태그 자동 부착, 민감 지역 좌표 블러 처리를 수행하며
    HTTP 요청/응답 형태는 알지 못합니다.
    """

    def __init__(self):
        self.repo = PinRepository()
        self.exif_service = ExifService()

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

    # ---------- 핀 등록 ----------

    def create_pin(
        self,
        db: Session,
        user_id: int,
        tour_spot_id: int,
        title: str,
        description: str,
        latitude: float,
        longitude: float,
        tag_names: list[str],
        image_bytes: bytes,
        image_filename: str,
    ) -> tuple[Pin, bool, str]:
        """
        핀 하나를 등록합니다. 반환값은 (생성된 핀, EXIF 검증 성공 여부, 안내 메시지).
        사진의 EXIF는 원본 좌표 기준으로 검증한 뒤, 저장 좌표만 필요 시 흐리게 처리합니다.
        """
        exif_result = self.exif_service.verify(image_bytes, latitude, longitude)

        is_blurred = self.is_sensitive_area(title, description, tag_names)
        stored_lat, stored_lng = (
            self.blur_coordinate(latitude, longitude) if is_blurred else (latitude, longitude)
        )

        tags = self._build_tags(db, tag_names, title, description)

        pin = self.repo.create(
            db,
            {
                "tour_spot_id": tour_spot_id,
                "user_id": user_id,
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

        db.commit()
        db.refresh(pin)

        message = exif_result.message
        if is_blurred:
            message += " 환경 민감 지역으로 판단되어 좌표를 약 500m 단위로 흐리게 표기합니다."

        return pin, exif_result.is_validated, message
