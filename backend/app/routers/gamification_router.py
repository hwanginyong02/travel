from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.routers.deps import get_authenticated_user
from app.schemas import (
    BadgeProgressResponse,
    PointHistoryResponse,
    PointTransactionResponse,
    ProfileSummaryResponse,
    RecentPinResponse,
    RecentSpotResponse,
)
from app.services import GamificationService

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


@router.get("/me", response_model=ProfileSummaryResponse)
def get_my_summary(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """프로필 첫 화면(레벨·포인트·뱃지·활동 요약)에 필요한 값을 한 번에 반환합니다."""
    summary = GamificationService().get_summary(db, user)

    return ProfileSummaryResponse(
        nickname=user.nickname,
        profile_image=user.profile_image,
        points=summary.points,
        level=summary.level,
        progress_percent=summary.progress_percent,
        points_to_next_level=summary.points_to_next_level,
        pins_count=summary.pins_count,
        verifications_count=summary.verifications_count,
        badges=[BadgeProgressResponse.from_progress(progress) for progress in summary.badges],
        recent_pins=[
            RecentPinResponse(
                id=pin.id,
                title=pin.title,
                photo_url=pin.photos[0].photo_url if pin.photos else None,
            )
            for pin in summary.recent_pins
        ],
        recent_spot=(
            RecentSpotResponse(
                id=summary.recent_spot.id,
                title=summary.recent_spot.title,
                firstimage=summary.recent_spot.firstimage,
                mapx=summary.recent_spot.mapx,
                mapy=summary.recent_spot.mapy,
            )
            if summary.recent_spot
            else None
        ),
    )


@router.get("/badges", response_model=List[BadgeProgressResponse])
def get_my_badges(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """획득/미획득 뱃지 전체를 진행도와 함께 조회합니다."""
    progresses = GamificationService().get_badge_progress(db, user.id)
    return [BadgeProgressResponse.from_progress(progress) for progress in progresses]


@router.get("/points", response_model=PointHistoryResponse)
def get_my_points(
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """누적 포인트와 적립 내역을 최신순으로 조회합니다."""
    service = GamificationService()
    transactions = service.get_point_history(db, user.id, limit=limit)

    return PointHistoryResponse(
        total_points=user.points or 0,
        level=service.level_of(user.points or 0),
        items=[
            PointTransactionResponse.from_transaction(transaction, service.describe_reason(transaction.reason))
            for transaction in transactions
        ],
    )
