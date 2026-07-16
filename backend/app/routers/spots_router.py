from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories import TourSpotRepository
from app.schemas import TourSpotResponse
from typing import List

router = APIRouter(prefix="/api/spots", tags=["spots"])

@router.get("", response_model=List[TourSpotResponse])
def get_spots(
    search: str = Query(None, description="Search query matching spot title"),
    cat3: str = Query(None, description="Filter by subcategory code cat3"),
    random: bool = Query(False, description="Whether to return spots in random order"),
    min_lat: float = Query(None, description="Minimum latitude of boundary"),
    max_lat: float = Query(None, description="Maximum latitude of boundary"),
    min_lng: float = Query(None, description="Minimum longitude of boundary"),
    max_lng: float = Query(None, description="Maximum longitude of boundary"),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1500),
    db: Session = Depends(get_db)
):
    repo = TourSpotRepository()
    
    # 만약 좌표 경계 조건이 들어왔다면 영역 기반 조회를 수행
    has_bounds = any(v is not None for v in [min_lat, max_lat, min_lng, max_lng])
    
    if has_bounds:
        spots = repo.get_spots_with_bounds(
            db,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lng=min_lng,
            max_lng=max_lng,
            cat3=cat3,
            limit=limit
        )
    elif cat3:
        spots = repo.get_spots_by_cat3(db, cat3=cat3, limit=limit)
    elif random:
        spots = repo.get_random_spots(db, limit=limit)
    else:
        spots = repo.search_spots(db, query=search, skip=skip, limit=limit)
    return spots




@router.get("/{spot_id}", response_model=TourSpotResponse)
def get_spot_by_id(
    spot_id: int,
    db: Session = Depends(get_db)
):
    repo = TourSpotRepository()
    spot = repo.get_by_id(db, spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
        
    db_changed = False

    # Dynamically fetch overview if empty to optimize bulk sync speed
    if not spot.overview:
        from app.services.tour_api_service import TourApiService
        try:
            service = TourApiService()
            overview = service.fetch_spot_overview(spot_id)
            if overview:
                spot.overview = overview
                db_changed = True
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to fetch overview dynamically for spot {spot_id}: {e}")
            
    # Dynamically fetch detailed intro_info if empty
    if not spot.intro_info:
        from app.services.tour_api_service import TourApiService
        try:
            service = TourApiService()
            intro_info = service.fetch_spot_intro(spot_id, spot.contenttypeid or 12)
            if intro_info:
                spot.intro_info = intro_info
                db_changed = True
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to fetch intro_info dynamically for spot {spot_id}: {e}")

    if db_changed:
        db.commit()
        db.refresh(spot)
            
    return spot


