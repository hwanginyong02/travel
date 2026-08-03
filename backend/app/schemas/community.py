from pydantic import BaseModel
from typing import List, Optional

class TrendingSpotResponse(BaseModel):
    id: int
    title: str
    parent_spot: str
    tag: str
    previous_quarter_score: int = 0
    search_count: int = 0
    pins_count: int = 0
    score: int = 0
    growth: str
    avatar: str
    updater: str
    status: str

    class Config:
        from_attributes = True

class HonorPinResponse(BaseModel):
    id: str
    pin_id: int
    spot_name: str
    user: str
    avatar: str
    photo: str
    content: str
    tag: str
    verified_count: int
    created_at: str

    class Config:
        from_attributes = True

class FeedPinItemResponse(BaseModel):
    id: int
    title: str
    description: str
    spot_id: int
    spot_name: str
    user_name: str
    user_avatar: str
    user_level: int = 1
    photo_url: str
    tags: List[str] = []
    verified_count: int = 0
    reliability_score: int = 100
    latitude: float
    longitude: float
    created_at: str

    class Config:
        from_attributes = True

class CommunityDataResponse(BaseModel):
    trending_spots: List[TrendingSpotResponse]
    top_reviews: List[HonorPinResponse]
