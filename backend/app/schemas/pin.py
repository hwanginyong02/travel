from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List

from app.schemas.gamification import RewardResponse


class TagResponse(BaseModel):
    id: int
    name: str
    is_danger: bool

    class Config:
        from_attributes = True


class PinPhotoResponse(BaseModel):
    id: int
    photo_url: str
    exif_taken_at: Optional[datetime] = None
    is_validated: bool

    class Config:
        from_attributes = True


class PinAuthorResponse(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True


class PinCreateRequest(BaseModel):
    """
    핀 등록 요청. multipart/form-data로 들어오는 값을 라우터에서 이 스키마로 조립합니다.
    사진 파일(UploadFile)은 Pydantic이 다루지 않으므로 라우터에서 별도로 받습니다.

    좌표는 받지 않습니다. 핀 좌표는 사진의 EXIF에서 서버가 직접 읽습니다.
    """
    tour_spot_id: int
    title: str = Field(min_length=1, max_length=60)
    description: str = Field(min_length=1, max_length=1000)
    tags: List[str] = Field(default_factory=list, max_length=10)

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, values: List[str]) -> List[str]:
        """'#' 접두사를 제거하고 공백/중복을 정리합니다. 태그 정규화는 오직 여기서만 수행합니다."""
        normalized = []
        for raw in values:
            name = raw.strip().lstrip("#").strip()
            if name and name not in normalized:
                normalized.append(name[:20])
        return normalized


class PinResponse(BaseModel):
    id: int
    tour_spot_id: int
    tour_spot_title: Optional[str] = None
    title: str
    description: str
    latitude: float
    longitude: float
    is_blurred: bool
    reliability_score: int
    verification_count: int = 0
    still_there_count: int = 0
    created_at: datetime
    last_status_checked_at: Optional[datetime] = None

    user: Optional[PinAuthorResponse] = None
    tags: List[TagResponse] = Field(default_factory=list)
    photos: List[PinPhotoResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class PinCreateResponse(BaseModel):
    """등록 직후 응답. 검증 결과와 획득 보상을 사용자에게 알려주기 위해 pin과 함께 내려보냅니다."""
    pin: PinResponse
    exif_validated: bool
    validation_message: str
    reward: Optional[RewardResponse] = None
    photo_taken_at: Optional[datetime] = None
    is_photo_recent: bool = False


class PhotoExifPreviewResponse(BaseModel):
    """
    등록 전 사진 검사 결과.
    제출 버튼을 누른 뒤에야 '등록 불가'를 알게 되는 일이 없도록 미리 알려줍니다.
    """
    can_register: bool
    has_gps: bool
    is_recent: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    taken_at: Optional[datetime] = None
    age_days: Optional[int] = None
    distance_m: Optional[int] = None
    message: str
