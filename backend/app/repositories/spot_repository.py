from typing import Iterable, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Pin, Tag, TourSpot, User, Verification, pin_tags


class TourSpotRepository:
    def get_by_id(self, db: Session, spot_id: int):
        return db.query(TourSpot).filter(TourSpot.id == spot_id).first()

    def search_spots(self, db: Session, query: str = None, skip: int = 0, limit: int = 50):
        q = db.query(TourSpot)
        if query:
            q = q.filter(TourSpot.title.ilike(f"%{query}%"))
        return q.offset(skip).limit(limit).all()

    def get_random_spots(self, db: Session, limit: int = 5):
        from sqlalchemy.sql.expression import func
        return db.query(TourSpot).order_by(func.random()).limit(limit).all()

    def get_spots_by_cat3(self, db: Session, cat3: str, limit: int = 50):
        return db.query(TourSpot).filter(TourSpot.cat3 == cat3).limit(limit).all()

    def get_spots_with_bounds(
        self,
        db: Session,
        min_lat: float = None,
        max_lat: float = None,
        min_lng: float = None,
        max_lng: float = None,
        cat3: str = None,
        limit: int = 1000
    ):
        q = db.query(TourSpot)
        
        # Bounding box filters (mapy = latitude, mapx = longitude)
        if min_lat is not None:
            q = q.filter(TourSpot.mapy >= min_lat)
        if max_lat is not None:
            q = q.filter(TourSpot.mapy <= max_lat)
        if min_lng is not None:
            q = q.filter(TourSpot.mapx >= min_lng)
        if max_lng is not None:
            q = q.filter(TourSpot.mapx <= max_lng)
            
        if cat3:
            q = q.filter(TourSpot.cat3 == cat3)
            
        return q.limit(limit).all()




    # ---------- 추천/검색용 집계 ----------

    def _activity_pin_filter(self, user_ids: list[int]):
        """
        해당 사용자들이 '직접 등록했거나 방문 인증한' 핀을 고르는 조건.
        등록과 인증 둘 다 그 장소에 대한 관심 표현이므로 같은 취향 신호로 봅니다.
        """
        verified_pin_ids = select(Verification.pin_id).where(Verification.user_id.in_(user_ids))
        return or_(Pin.user_id.in_(user_ids), Pin.id.in_(verified_pin_ids))

    def get_category_affinity(self, db: Session, user_ids: list[int]) -> list[tuple[Optional[str], Optional[str], int]]:
        """사용자들의 활동 이력을 (cat2, cat3, 횟수) 히스토그램으로 집계합니다."""
        if not user_ids:
            return []
        return (
            db.query(TourSpot.cat2, TourSpot.cat3, func.count(Pin.id))
            .join(Pin, Pin.tour_spot_id == TourSpot.id)
            .filter(self._activity_pin_filter(user_ids))
            .group_by(TourSpot.cat2, TourSpot.cat3)
            .all()
        )

    def get_tag_affinity(self, db: Session, user_ids: list[int]) -> list[tuple[str, int]]:
        """
        사용자들의 활동 이력을 (경험 태그, 횟수) 히스토그램으로 집계합니다.
        낙상주의 같은 위험 태그(is_danger)는 설명 텍스트를 보고 자동으로 붙는 것이라
        사용자 선호가 아니므로 제외합니다.
        """
        if not user_ids:
            return []
        return (
            db.query(Tag.name, func.count(Pin.id))
            .join(pin_tags, pin_tags.c.tag_id == Tag.id)
            .join(Pin, Pin.id == pin_tags.c.pin_id)
            .filter(Tag.is_danger.is_(False), self._activity_pin_filter(user_ids))
            .group_by(Tag.name)
            .all()
        )

    def get_visited_spot_ids(self, db: Session, user_id: int) -> set[int]:
        """사용자가 이미 핀을 찍었거나 인증한 명소 ID. 추천에서 제외할 대상입니다."""
        rows = (
            db.query(Pin.tour_spot_id)
            .filter(self._activity_pin_filter([user_id]))
            .distinct()
            .all()
        )
        return {row[0] for row in rows}

    def get_cohort_user_ids(
        self,
        db: Session,
        gender: Optional[str],
        age_group: Optional[str],
        exclude_user_id: Optional[int] = None,
        limit: int = 500,
    ) -> list[int]:
        """같은 성별·연령대 사용자 ID. 활동 이력이 없는 신규 유저의 콜드스타트용입니다."""
        if not gender or not age_group:
            return []
        q = db.query(User.id).filter(User.gender == gender, User.age_group == age_group)
        if exclude_user_id is not None:
            q = q.filter(User.id != exclude_user_id)
        return [row[0] for row in q.limit(limit).all()]

    def get_scoring_candidates(
        self,
        db: Session,
        *,
        cat3_codes: Optional[Iterable[str]] = None,
        bounds: Optional[tuple[float, float, float, float]] = None,
        exclude_spot_ids: Optional[set[int]] = None,
        order_by_popularity: bool = False,
        limit: int = 300,
    ) -> list[tuple[TourSpot, int]]:
        """
        점수 계산에 넘길 후보 명소를 (명소, 핀 개수) 형태로 가져옵니다.

        핀 개수를 SQL 집계로 함께 뽑는 이유는 TourSpot.pins_count 프로퍼티가
        len(self.pins)라서, 그냥 쓰면 명소마다 쿼리가 한 번씩 더 나가기 때문입니다.
        bounds는 (min_lat, max_lat, min_lng, max_lng) 순서입니다.
        """
        pins_count = func.count(Pin.id).label("pins_count")
        q = (
            db.query(TourSpot, pins_count)
            .outerjoin(Pin, Pin.tour_spot_id == TourSpot.id)
            .group_by(TourSpot.id)
        )

        if bounds is not None:
            min_lat, max_lat, min_lng, max_lng = bounds
            q = q.filter(
                TourSpot.mapy >= min_lat,
                TourSpot.mapy <= max_lat,
                TourSpot.mapx >= min_lng,
                TourSpot.mapx <= max_lng,
            )

        cat3_list = [code for code in (cat3_codes or []) if code]
        if cat3_list:
            q = q.filter(TourSpot.cat3.in_(cat3_list))

        if exclude_spot_ids:
            q = q.filter(~TourSpot.id.in_(exclude_spot_ids))

        if order_by_popularity:
            q = q.order_by((TourSpot.previous_quarter_score + TourSpot.search_count + pins_count).desc())
        else:
            # 후보를 좁힐 때 항상 같은 앞부분만 잘리지 않도록 무작위로 표본을 뜹니다.
            q = q.order_by(func.random())

        return [(spot, count or 0) for spot, count in q.limit(limit).all()]

    def get_spot_tag_map(self, db: Session, spot_ids: Iterable[int]) -> dict[int, set[str]]:
        """명소별로 그 안의 핀들에 달린 경험 태그 집합을 한 번의 쿼리로 가져옵니다."""
        ids = list(spot_ids)
        if not ids:
            return {}
        rows = (
            db.query(Pin.tour_spot_id, Tag.name)
            .join(pin_tags, pin_tags.c.pin_id == Pin.id)
            .join(Tag, Tag.id == pin_tags.c.tag_id)
            .filter(Pin.tour_spot_id.in_(ids), Tag.is_danger.is_(False))
            .distinct()
            .all()
        )
        tag_map: dict[int, set[str]] = {}
        for spot_id, tag_name in rows:
            tag_map.setdefault(spot_id, set()).add(tag_name)
        return tag_map

    def query_spots(
        self,
        db: Session,
        *,
        cat3: Optional[str] = None,
        bounds: Optional[tuple[float, float, float, float]] = None,
        random_order: bool = False,
        skip: int = 0,
        limit: int = 500,
    ) -> list[TourSpot]:
        """
        목록/검색용 공통 조회. 필터는 SQL에서 걸고 키워드 점수 계산은 서비스 계층이 합니다.

        기존 라우터는 bounds / cat3 / random / search를 배타적 if-elif로 처리해서
        '이 지도 범위 안에서 계곡 검색' 같은 조합이 불가능했습니다. 여기서는 조건을
        누적해서 겁니다.

        pins_count 직렬화 때 명소마다 쿼리가 나가지 않도록 pins를 미리 적재합니다.
        """
        q = db.query(TourSpot).options(selectinload(TourSpot.pins))

        if bounds is not None:
            min_lat, max_lat, min_lng, max_lng = bounds
            q = q.filter(
                TourSpot.mapy >= min_lat,
                TourSpot.mapy <= max_lat,
                TourSpot.mapx >= min_lng,
                TourSpot.mapx <= max_lng,
            )
        if cat3:
            q = q.filter(TourSpot.cat3 == cat3)

        if random_order:
            q = q.order_by(func.random())

        return q.offset(skip).limit(limit).all()

    def bump_search_count(self, db: Session, spot_id: int) -> None:
        """
        명소 조회 횟수를 1 올립니다. commit은 호출한 쪽이 합니다.

        컬럼명은 search_count지만 실제 의미는 '상세 조회수'에 가깝습니다.
        검색 목록 응답에서 올리면 300ms 디바운스 타이핑마다 값이 부풀려지기 때문에,
        실제 관심 1회에 대응하는 상세 조회 시점에만 증가시킵니다.
        이 값은 커뮤니티의 '실시간 급상승 장소' 순위(community_router)에도 쓰입니다.
        """
        db.query(TourSpot).filter(TourSpot.id == spot_id).update(
            {TourSpot.search_count: TourSpot.search_count + 1},
            synchronize_session=False,
        )

    def upsert_spot(self, db: Session, spot_data: dict) -> TourSpot:
        spot_id = spot_data.get("id")
        db_spot = self.get_by_id(db, spot_id)
        if db_spot:
            # Update fields
            for key, value in spot_data.items():
                if hasattr(db_spot, key):
                    setattr(db_spot, key, value)
        else:
            db_spot = TourSpot(**spot_data)
            db.add(db_spot)
        
        db.commit()
        db.refresh(db_spot)
        return db_spot
