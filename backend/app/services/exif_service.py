import logging
from datetime import datetime
from io import BytesIO
from math import radians, sin, cos, asin, sqrt
from typing import Optional

from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

# EXIF 좌표와 등록 좌표가 이 거리 이내면 "현장에서 찍은 사진"으로 인정합니다.
EXIF_MATCH_RADIUS_M = 300

# 좌표가 약 500m 격자로 흐려진 핀을 검증할 때 더해주는 여유 반경.
BLURRED_PIN_EXTRA_RADIUS_M = 500

_GPS_IFD_TAG = next((k for k, v in ExifTags.TAGS.items() if v == "GPSInfo"), 34853)
_DATETIME_ORIGINAL_TAG = next((k for k, v in ExifTags.TAGS.items() if v == "DateTimeOriginal"), 36867)


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """두 좌표 사이의 실제 거리를 미터로 반환합니다."""
    r = 6371000.0
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    return 2 * r * asin(sqrt(a))


def _to_degrees(value) -> Optional[float]:
    """EXIF의 (도, 분, 초) 유리수 튜플을 십진 도수로 변환합니다."""
    try:
        d, m, s = (float(v) for v in value)
        return d + m / 60.0 + s / 3600.0
    except (TypeError, ValueError, ZeroDivisionError):
        return None


class ExifResult:
    """EXIF 추출 및 검증 결과를 담는 값 객체."""

    def __init__(
        self,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        taken_at: Optional[datetime] = None,
        is_validated: bool = False,
        message: str = "",
    ):
        self.latitude = latitude
        self.longitude = longitude
        self.taken_at = taken_at
        self.is_validated = is_validated
        self.message = message


class ExifService:
    """
    사진의 EXIF 메타데이터에서 GPS 좌표와 촬영 시각을 추출하고,
    사용자가 등록한 좌표와 일치하는지 검증합니다. HTTP나 DB를 알지 못합니다.
    """

    def extract(self, image_bytes: bytes) -> tuple[Optional[float], Optional[float], Optional[datetime]]:
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                exif = img.getexif()
                if not exif:
                    return None, None, None

                taken_at = self._parse_taken_at(exif.get(_DATETIME_ORIGINAL_TAG))

                gps = exif.get_ifd(_GPS_IFD_TAG)
                if not gps:
                    return None, None, taken_at

                lat = self._parse_coordinate(gps.get(2), gps.get(1), "S")
                lng = self._parse_coordinate(gps.get(4), gps.get(3), "W")
                return lat, lng, taken_at
        except Exception as e:
            logger.warning(f"Failed to read EXIF metadata: {e}")
            return None, None, None

    def _parse_coordinate(self, raw_value, ref, negative_ref: str) -> Optional[float]:
        if not raw_value:
            return None
        degrees = _to_degrees(raw_value)
        if degrees is None:
            return None
        if isinstance(ref, (bytes, bytearray)):
            ref = ref.decode(errors="ignore")
        if isinstance(ref, str) and ref.strip().upper().startswith(negative_ref):
            degrees = -degrees
        return degrees

    def _parse_taken_at(self, raw_value) -> Optional[datetime]:
        if not raw_value:
            return None
        if isinstance(raw_value, (bytes, bytearray)):
            raw_value = raw_value.decode(errors="ignore")
        try:
            return datetime.strptime(str(raw_value).strip(), "%Y:%m:%d %H:%M:%S")
        except ValueError:
            return None

    def verify(
        self,
        image_bytes: bytes,
        latitude: float,
        longitude: float,
        radius_m: float = EXIF_MATCH_RADIUS_M,
    ) -> ExifResult:
        """
        사진의 EXIF 좌표가 기준 좌표와 radius_m 이내인지 확인합니다.
        GPS 정보가 없는 사진도 등록은 허용하되, '미검증' 상태로 남겨 신뢰도에서 구분합니다.

        좌표가 흐리게 저장된(is_blurred) 핀을 검증할 때는 블러 오차만큼
        radius_m을 넓혀 정상 방문자가 억울하게 실패하지 않도록 합니다.
        """
        exif_lat, exif_lng, taken_at = self.extract(image_bytes)

        if exif_lat is None or exif_lng is None:
            return ExifResult(
                taken_at=taken_at,
                is_validated=False,
                message="사진에 위치 정보(GPS)가 없어 현장 촬영 여부를 확인하지 못했습니다.",
            )

        distance = haversine_meters(latitude, longitude, exif_lat, exif_lng)
        if distance <= radius_m:
            return ExifResult(
                latitude=exif_lat,
                longitude=exif_lng,
                taken_at=taken_at,
                is_validated=True,
                message=f"현장 촬영이 확인되었습니다. (오차 약 {int(distance)}m)",
            )

        return ExifResult(
            latitude=exif_lat,
            longitude=exif_lng,
            taken_at=taken_at,
            is_validated=False,
            message=f"사진의 촬영 위치가 등록 좌표에서 약 {int(distance)}m 떨어져 있어 검증되지 않았습니다.",
        )
