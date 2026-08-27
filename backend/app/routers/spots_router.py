from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.repositories import TourSpotRepository
from app.routers.deps import get_optional_user
from app.schemas import RecommendedSpotResponse, RecommendListResponse, TourSpotResponse
from app.services.recommendation_service import RecommendationService
from app.services.search_service import rank_spots

router = APIRouter(prefix="/api/spots", tags=["spots"])

# 키워드 점수를 매길 후보 상한. 검색 결과 limit보다 넉넉히 잡아야
# 제목에는 안 걸리고 카테고리/태그로만 걸리는 명소도 후보에 들어옵니다.
SEARCH_POOL = 1500


def _bounds_from(
    min_lat: Optional[float],
    max_lat: Optional[float],
    min_lng: Optional[float],
    max_lng: Optional[float],
) -> Optional[tuple[float, float, float, float]]:
    """네 값 중 하나라도 들어오면 나머지는 무한대로 열어 둔 채 좌표 박스를 만듭니다."""
    if all(v is None for v in (min_lat, max_lat, min_lng, max_lng)):
        return None
    return (
        min_lat if min_lat is not None else -90.0,
        max_lat if max_lat is not None else 90.0,
        min_lng if min_lng is not None else -180.0,
        max_lng if max_lng is not None else 180.0,
    )


@router.get("", response_model=List[TourSpotResponse])
def get_spots(
    search: str = Query(None, description="Search query matching title, overview, category and tags"),
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
    """
    명소 목록 조회. bounds·cat3 필터와 검색어를 함께 쓸 수 있습니다.
    검색어가 있으면 일치 강도 순으로 정렬해서 돌려줍니다.
    """
    repo = TourSpotRepository()
    bounds = _bounds_from(min_lat, max_lat, min_lng, max_lng)

    if search and search.strip():
        # 랭킹을 매기려면 후보를 넉넉히 받아 와야 하므로 limit은 정렬 뒤에 적용합니다.
        candidates = repo.query_spots(db, cat3=cat3, bounds=bounds, limit=SEARCH_POOL)
        tag_map = repo.get_spot_tag_map(db, [spot.id for spot in candidates])
        return rank_spots(candidates, search, tag_map, limit=limit)

    return repo.query_spots(
        db,
        cat3=cat3,
        bounds=bounds,
        random_order=random,
        skip=skip,
        limit=limit,
    )


@router.get("/recommend", response_model=RecommendListResponse)
def recommend_spots(
    limit: int = Query(5, ge=1, le=20),
    lat: float = Query(None, description="User's current latitude"),
    lng: float = Query(None, description="User's current longitude"),
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    검색 화면의 기본 목록을 사용자 맞춤으로 채웁니다.

    로그인하지 않았거나 활동 이력이 없어도 항상 결과를 돌려줍니다.
    어떤 근거가 쓰였는지는 응답의 strategy로 알 수 있습니다.
    (personal | cohort | nearby | popular | random)
    """
    service = RecommendationService()
    scored, strategy = service.recommend(db, user=user, lat=lat, lng=lng, limit=limit)

    return RecommendListResponse(
        strategy=strategy,
        spots=[
            RecommendedSpotResponse(
                id=item.spot.id,
                title=item.spot.title,
                mapx=item.spot.mapx,
                mapy=item.spot.mapy,
                firstimage=item.spot.firstimage,
                overview=item.spot.overview,
                cat1=item.spot.cat1,
                cat2=item.spot.cat2,
                cat3=item.spot.cat3,
                contenttypeid=item.spot.contenttypeid,
                intro_info=item.spot.intro_info,
                pins_count=item.pins_count,
                reason=item.reason,
                score=item.score,
                distance_text=item.distance_text,
            )
            for item in scored
        ],
    )


@router.get("/{spot_id}", response_model=TourSpotResponse)
def get_spot_by_id(
    spot_id: int,
    db: Session = Depends(get_db)
):
    repo = TourSpotRepository()
    spot = repo.get_by_id(db, spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    # 상세 조회 = 실제 관심 1회. 이 값이 추천의 인기도 점수와
    # 커뮤니티 '실시간 급상승 장소' 순위에 쓰입니다.
    # 조회할 때마다 쓰기가 생기므로 아래에서 항상 commit합니다.
    repo.bump_search_count(db, spot_id)

    # Dynamically fetch overview if empty to optimize bulk sync speed
    if not spot.overview:
        from app.services.tour_api_service import TourApiService
        try:
            service = TourApiService()
            overview = service.fetch_spot_overview(spot_id)
            if overview:
                spot.overview = overview
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
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to fetch intro_info dynamically for spot {spot_id}: {e}")

    db.commit()
    db.refresh(spot)

    return spot
