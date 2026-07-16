from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

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
