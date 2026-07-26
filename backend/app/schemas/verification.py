from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.schemas.pin import PinAuthorResponse


class VerificationCreateRequest(BaseModel):
    """
    방문 인증 요청. multipart/form-data로 들어온 값을 라우터에서 이 스키마로 조립합니다.
    사진(UploadFile)은 선택이며 Pydantic이 다루지 않으므로 라우터에서 별도로 받습니다.
    """
    pin_id: int
    is_still_there: bool


class VerificationResponse(BaseModel):
    id: int
    pin_id: int
    is_still_there: bool
    photo_url: Optional[str] = None
    created_at: datetime
    user: Optional[PinAuthorResponse] = None

    class Config:
        from_attributes = True


class VerificationCreateResponse(BaseModel):
    """인증 직후 응답. 갱신된 신뢰도와 검증 결과를 사용자에게 바로 알려줍니다."""
    verification: VerificationResponse
    reliability_score: int
    photo_validated: bool
    message: str
