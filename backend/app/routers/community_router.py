import random
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.models import TourSpot, Pin
from app.schemas.community import (
    CommunityDataResponse,
    TrendingSpotResponse,
    HonorPinResponse,
    FeedPinItemResponse,
)
from app.services.category_service import format_category_name
from app.services.verification_service import calculate_reliability

router = APIRouter(prefix="/api/community", tags=["community"])


@router.get("", response_model=CommunityDataResponse)
def get_community_overview(db: Session = Depends(get_db)):
    """
    커뮤니티 메인 데이터를 실시간 DB 기반으로 조회합니다.
    1. 실시간 급상승 장소: (전 분기 점수 + 핀 수 + 검색량) 기반 상위 장소
    2. 이달의 명예로운 쉼표: 인증 수 기준 상위 3개 핀
    """
    trending_spots: List[TrendingSpotResponse] = []
    top_reviews: List[HonorPinResponse] = []

    # 1. DB에서 명소 데이터 조회 및 급상승 점수 계산
    spots = db.query(TourSpot).options(selectinload(TourSpot.pins)).all()
    if spots:
        calculated_spots = []
        for s in spots:
            pins_cnt = len(s.pins)
            search_cnt = getattr(s, "search_count", 0) or 0
            prev_score = getattr(s, "previous_quarter_score", 0) or 0
            total_score = prev_score + pins_cnt + search_cnt

            calculated_spots.append({
                "spot": s,
                "prev_score": prev_score,
                "pins_count": pins_cnt,
                "search_count": search_cnt,
                "score": total_score
            })

        calculated_spots.sort(key=lambda x: x["score"], reverse=True)
        top_db_spots = [item for item in calculated_spots if item["score"] > 0][:5]

        if not top_db_spots and calculated_spots:
            top_db_spots = calculated_spots[:5]

        for item in top_db_spots:
            s = item["spot"]
            parent_text = format_category_name(s.cat1 or s.cat2)

            tag_name = "#자연명소"
            first_updater = "자연탐험가"
            first_avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"

            if s.pins and s.pins[0]:
                first_pin = s.pins[0]
                if first_pin.tags and first_pin.tags[0]:
                    tag_name = f"#{first_pin.tags[0].name}"
                if first_pin.user:
                    first_updater = first_pin.user.nickname
                    if first_pin.user.profile_image:
                        first_avatar = first_pin.user.profile_image

            trending_spots.append(
                TrendingSpotResponse(
                    id=s.id,
                    title=s.title,
                    parent_spot=parent_text,
                    tag=tag_name,
                    previous_quarter_score=item["prev_score"],
                    search_count=item["search_count"],
                    pins_count=item["pins_count"],
                    score=item["score"],
                    growth=f"급상승 +{item['score']}",
                    avatar=first_avatar,
                    updater=first_updater,
                    status="실시간 급상승 장소",
                )
            )

    # 2. DB에서 핀 데이터 조회 및 인증 수 기준 상위 3개 선출
    pins = (
        db.query(Pin)
        .options(
            selectinload(Pin.user),
            selectinload(Pin.tour_spot),
            selectinload(Pin.photos),
            selectinload(Pin.tags),
            selectinload(Pin.verifications),
        )
        .all()
    )

    if pins:
        sorted_pins = sorted(pins, key=lambda p: len(p.verifications), reverse=True)[:3]
        for p in sorted_pins:
            photo_url = p.photos[0].photo_url if p.photos else "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=80"
            tag_name = f"#{p.tags[0].name}" if p.tags else "#힐링쉼표"
            user_name = p.user.nickname if p.user else "익명사용자"
            user_avatar = p.user.profile_image if (p.user and p.user.profile_image) else "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
            spot_title = p.tour_spot.title if p.tour_spot else p.title

            top_reviews.append(
                HonorPinResponse(
                    id=f"pin-{p.id}",
                    pin_id=p.id,
                    spot_name=spot_title,
                    user=user_name,
                    avatar=user_avatar,
                    photo=photo_url,
                    content=p.description,
                    tag=tag_name,
                    verified_count=len(p.verifications),
                    created_at="최근",
                )
            )

    return CommunityDataResponse(
        trending_spots=trending_spots,
        top_reviews=top_reviews,
    )


@router.get("/feed", response_model=List[FeedPinItemResponse])
def get_community_feed(
    mode: str = Query("random", pattern="^(random|latest)$"),
    db: Session = Depends(get_db)
):
    """
    인스타그램 피드 스타일의 전체 쉼표(핀) 피드 목록을 무한/랜덤 렌더링으로 제공합니다.
    """
    pins = (
        db.query(Pin)
        .options(
            selectinload(Pin.user),
            selectinload(Pin.tour_spot),
            selectinload(Pin.photos),
            selectinload(Pin.tags),
            selectinload(Pin.verifications),
        )
        .all()
    )

    if mode == "random":
        random.shuffle(pins)
    else:
        pins.sort(key=lambda p: p.created_at, reverse=True)

    feed_items: List[FeedPinItemResponse] = []
    for p in pins:
        # 사진 선택 (핀 대표 사진 -> 없으면 인증 사진 -> 기본 사진)
        photo_url = "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80"
        if p.photos and p.photos[0].photo_url:
            photo_url = p.photos[0].photo_url
        elif p.verifications:
            v_photos = [v.photo_url for v in p.verifications if v.photo_url]
            if v_photos:
                photo_url = v_photos[0]

        tag_list = [f"#{t.name}" for t in p.tags] if p.tags else ["#자연명소", "#숨은쉼터"]
        user_name = p.user.nickname if p.user else "익명 탐험가"
        user_avatar = (
            p.user.profile_image
            if (p.user and p.user.profile_image)
            else "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
        )
        user_level = getattr(p.user, "level", 1) if p.user else 1
        spot_name = p.tour_spot.title if p.tour_spot else p.title
        spot_id = p.tour_spot_id if p.tour_spot_id else 0

        reliability = calculate_reliability(p)

        feed_items.append(
            FeedPinItemResponse(
                id=p.id,
                title=p.title,
                description=p.description,
                spot_id=spot_id,
                spot_name=spot_name,
                user_name=user_name,
                user_avatar=user_avatar,
                user_level=user_level,
                photo_url=photo_url,
                tags=tag_list,
                verified_count=len(p.verifications),
                reliability_score=reliability,
                latitude=p.latitude,
                longitude=p.longitude,
                created_at=p.created_at.strftime("%Y.%m.%d") if p.created_at else "최근",
            )
        )

    return feed_items
