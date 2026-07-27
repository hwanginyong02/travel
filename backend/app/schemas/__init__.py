# Schemas 계층 (데이터 검증 및 직렬화 - Pydantic)
from .spot import TourSpotResponse, TourSpotBase
from .gamification import (
    BadgeBriefResponse,
    BadgeProgressResponse,
    PointHistoryResponse,
    PointTransactionResponse,
    ProfileSummaryResponse,
    RecentPinResponse,
    RecentSpotResponse,
    RewardResponse,
)
from .pin import (
    PinCreateRequest,
    PinCreateResponse,
    PinResponse,
    PinPhotoResponse,
    PinAuthorResponse,
    PhotoExifPreviewResponse,
    TagResponse,
)
from .verification import (
    VerificationCreateRequest,
    VerificationCreateResponse,
    VerificationResponse,
)

