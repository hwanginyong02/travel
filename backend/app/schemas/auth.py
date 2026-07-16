from pydantic import BaseModel
from typing import Optional


class SocialLoginRequest(BaseModel):
    provider: str           # 'google' | 'kakao'
    access_token: Optional[str] = None
    code: Optional[str] = None
    redirect_uri: Optional[str] = None



class RegisterRequest(BaseModel):
    nickname: str
    gender: str             # 'male' | 'female'
    age_group: str          # '10대', '20대', '30대', '40대', '50대 이상'


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new: bool = False
    social_nickname: Optional[str] = None


class NicknameCheckResponse(BaseModel):
    available: bool
    message: str


class UserProfileResponse(BaseModel):
    id: int
    nickname: str
    email: Optional[str] = None
    gender: Optional[str] = None
    age_group: Optional[str] = None
    profile_image: Optional[str] = None
    level: int
    points: int

    class Config:
        from_attributes = True
