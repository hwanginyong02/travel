import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from io import BytesIO
from math import radians, sin, cos, asin, sqrt
from typing import Optional

from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

# EXIF 좌표와 등록 좌표가 이 거리 이내면 "현장에서 찍은 사진"으로 인정합니다.
EXIF_MATCH_RADIUS_M = 300

# 좌표가 약 500m 격자로 흐려진 핀을 검증할 때 더해주는 여유 반경.
BLURRED_PIN_EXTRA_RADIUS_M = 500

# 명소 대표 좌표에서 이만큼 벗어난 사진은 다른 명소의 사진으로 봅니다.
# TourAPI는 명소당 좌표를 한 쌍만 주므로 명소 크기를 알 수 없습니다.
# 국내 최대인 지리산국립공원(반경 약 20km)을 덮는 느슨한 상한으로만 씁니다.
SPOT_MATCH_RADIUS_M = 20_000

# 촬영한 지 이 기간이 지난 사진은 "지금의 현장"을 증명하지 못한다고 봅니다.
PHOTO_MAX_AGE_DAYS = 14

# 카메라 시계 오차 허용치. 이보다 더 미래로 찍힌 사진은 인정하지 않습니다.
CLOCK_SKEW_TOLERANCE_DAYS = 1

_GPS_IFD_TAG = next((k for k, v in ExifTags.TAGS.items() if v == "GPSInfo"), 34853)
_EXIF_IFD_TAG = next((k for k, v in ExifTags.TAGS.items() if v == "ExifOffset"), 34665)
_DATETIME_ORIGINAL_TAG = next((k for k, v in ExifTags.TAGS.items() if v == "DateTimeOriginal"), 36867)
_DATETIME_TAG = next((k for k, v in ExifTags.TAGS.items() if v == "DateTime"), 306)


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


@dataclass
class ExifResult:
    """
    EXIF 추출 및 검증 결과.
    호출한 쪽이 '왜 실패했는지'로 분기할 수 있도록 판정 근거를 따로 담습니다.
    """
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    taken_at: Optional[datetime] = None
    distance_m: Optional[float] = None
    age_days: Optional[float] = None
    has_gps: bool = False
    within_radius: bool = False
    is_recent: bool = False
    message: str = ""

    @property
    def is_validated(self) -> bool:
        """현장에서, 최근에 찍은 사진으로 인정되는 상태."""
        return self.has_gps and self.within_radius and self.is_recent


def format_distance(distance_m: Optional[float]) -> str:
    """거리를 사람이 읽기 좋은 단위로 표기합니다. (예: 320m, 3.2km)"""
    if distance_m is None:
        return "0m"
    if distance_m >= 1000:
        return f"{distance_m / 1000:.1f}km"
    return f"{int(distance_m)}m"


def photo_age_days(taken_at: Optional[datetime]) -> Optional[float]:
    """
    촬영 후 지난 일수. 미래로 찍힌 사진은 음수가 됩니다.
    EXIF의 촬영 시각에는 표준시 정보가 없어 카메라의 현지 시각으로 다룹니다.
    """
    if taken_at is None:
        return None

    reference = datetime.now(taken_at.tzinfo) if taken_at.tzinfo else datetime.now()
    return (reference - taken_at).total_seconds() / 86400.0


def is_recent_photo(taken_at: Optional[datetime], max_age_days: int = PHOTO_MAX_AGE_DAYS) -> bool:
    """촬영 시각이 없거나 기준 기간을 벗어나면 최근 사진으로 보지 않습니다."""
    age = photo_age_days(taken_at)
    if age is None:
        return False
    return -CLOCK_SKEW_TOLERANCE_DAYS <= age <= max_age_days


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

                taken_at = self._extract_taken_at(exif)

                gps = exif.get_ifd(_GPS_IFD_TAG)
                if not gps:
                    return None, None, taken_at

                lat = self._parse_coordinate(gps.get(2), gps.get(1), "S")
                lng = self._parse_coordinate(gps.get(4), gps.get(3), "W")
                return lat, lng, taken_at
        except Exception as e:
            logger.warning(f"Failed to read EXIF metadata: {e}")
            return None, None, None

    def _extract_taken_at(self, exif) -> Optional[datetime]:
        """
        촬영 시각을 읽습니다.

        DateTimeOriginal은 최상위 IFD가 아니라 Exif 서브 IFD 안에 들어 있어
        exif.get()으로는 절대 찾을 수 없습니다. 서브 IFD를 먼저 뒤지고,
        없으면 최상위의 DateTime(파일 수정 시각)으로 대신합니다.
        """
        exif_ifd = exif.get_ifd(_EXIF_IFD_TAG)
        raw_value = exif_ifd.get(_DATETIME_ORIGINAL_TAG) if exif_ifd else None

        if not raw_value:
            raw_value = exif.get(_DATETIME_TAG)

        return self._parse_taken_at(raw_value)

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
        max_age_days: int = PHOTO_MAX_AGE_DAYS,
    ) -> ExifResult:
        """
        사진이 기준 좌표 반경 안에서, 최근에 촬영되었는지 확인합니다.

        위치와 시간을 모두 봅니다. 위치만 보면 몇 년 전 사진도 통과해
        "지금의 현장"을 증명하지 못하기 때문입니다.
        판정 실패가 곧 거부는 아니며, 거부할지 감점할지는 호출한 서비스가 정합니다.

        좌표가 흐리게 저장된(is_blurred) 핀을 검증할 때는 블러 오차만큼
        radius_m을 넓혀 정상 방문자가 억울하게 실패하지 않도록 합니다.
        """
        exif_lat, exif_lng, taken_at = self.extract(image_bytes)

        result = ExifResult(
            latitude=exif_lat,
            longitude=exif_lng,
            taken_at=taken_at,
            age_days=photo_age_days(taken_at),
            has_gps=exif_lat is not None and exif_lng is not None,
            is_recent=is_recent_photo(taken_at, max_age_days),
        )

        if result.has_gps:
            result.distance_m = haversine_meters(latitude, longitude, exif_lat, exif_lng)
            result.within_radius = result.distance_m <= radius_m

        result.message = self._describe(result, max_age_days)
        return result

    def _describe(self, result: ExifResult, max_age_days: int) -> str:
        """판정 결과를 사용자에게 보여줄 한 문장으로 정리합니다."""
        if not result.has_gps:
            return "사진에 위치 정보(GPS)가 없습니다. 촬영 원본 사진을 올려주세요."

        if not result.within_radius:
            return (
                f"사진의 촬영 위치가 기준 지점에서 약 {format_distance(result.distance_m)} "
                "떨어져 있습니다."
            )

        if result.taken_at is None:
            return "사진에 촬영 시각이 없어 언제 찍었는지 확인하지 못했습니다."

        if result.age_days is not None and result.age_days < -CLOCK_SKEW_TOLERANCE_DAYS:
            return "사진의 촬영 시각이 미래로 기록되어 있어 확인하지 못했습니다."

        if not result.is_recent:
            return (
                f"{int(result.age_days)}일 전에 촬영된 사진이라 현재 상태와 다를 수 있습니다. "
                f"최근 {max_age_days}일 이내 사진만 검증됩니다."
            )

        return f"현장 촬영이 확인되었습니다. (오차 약 {format_distance(result.distance_m)})"
