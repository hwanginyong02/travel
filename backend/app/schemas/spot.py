from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class TourSpotBase(BaseModel):
    id: int
    title: str
    mapx: float
    mapy: float
    firstimage: Optional[str] = None
    overview: Optional[str] = None
    cat1: Optional[str] = None
    cat2: Optional[str] = None
    cat3: Optional[str] = None
    contenttypeid: Optional[int] = None
    intro_info: Optional[Dict[str, Any]] = None


class TourSpotResponse(TourSpotBase):
    pins_count: int
    created_at: datetime


    class Config:
        from_attributes = True


class RecommendedSpotResponse(TourSpotBase):
    """추천 목록의 명소 한 건. 왜 추천됐는지를 함께 내려 화면에 배지로 보여줍니다."""
    pins_count: int
    reason: str
    score: float
    distance_text: Optional[str] = None


class RecommendListResponse(BaseModel):
    """
    strategy는 어느 단계의 추천이 발동했는지를 알려줍니다.
    (personal | cohort | nearby | popular | random)
    프론트가 섹션 제목을 바꾸거나, 디버깅할 때 씁니다.
    """
    strategy: str
    spots: List[RecommendedSpotResponse]
