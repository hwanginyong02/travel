"""
검색 화면의 기본 목록을 "사용자가 갈 만한 곳"으로 채웁니다.

기존에는 ORDER BY random()으로 아무 명소나 5개 뽑았습니다. 여기서는 사용자의
활동 이력(어떤 카테고리·어떤 경험 태그의 장소에 핀을 찍고 인증했는지)과 현재
위치를 근거로 점수를 매깁니다.

데이터가 없는 초기 서비스에서도 화면이 비지 않도록 단계적으로 물러섭니다.
    personal → cohort → nearby → popular → random
"""
import random
from collections import Counter
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from app.models import TourSpot, User
from app.repositories import TourSpotRepository
from app.services.category_service import format_category_name
from app.services.exif_service import format_distance, haversine_meters

# 추천 근거. 응답의 strategy 필드로 내려가며, 프론트가 섹션 문구를 바꾸는 데 씁니다.
STRATEGY_PERSONAL = "personal"
STRATEGY_COHORT = "cohort"
STRATEGY_NEARBY = "nearby"
STRATEGY_POPULAR = "popular"
STRATEGY_RANDOM = "random"

# 점수 가중치. 쓸 수 없는 신호가 있으면 아래 _normalized_weights에서 재분배합니다.
WEIGHT_CATEGORY = 0.35
WEIGHT_TAG = 0.25
WEIGHT_DISTANCE = 0.25
WEIGHT_POPULARITY = 0.15

# 같은 사용자에게 매번 똑같은 목록이 나오면 "새로운 곳을 발견하는" 느낌이 사라집니다.
# 순위를 뒤집을 만큼은 아니고 비슷한 점수끼리만 섞이는 크기로 잡았습니다.
JITTER_MAX = 0.08

# 이 거리를 넘으면 근접 점수는 0입니다.
MAX_DISTANCE_KM = 100.0

# 후보 선필터용 좌표 박스. 위도 37도 부근에서 각각 약 100km에 해당합니다.
BOUND_DELTA_LAT = 0.9
BOUND_DELTA_LNG = 1.15

# 점수를 계산할 후보 수. 전체 테이블을 메모리에 올리지 않기 위한 상한입니다.
CANDIDATE_POOL = 300

# 취향 벡터에서 후보 선필터에 쓸 상위 카테고리 개수.
TOP_CATEGORY_FILTER = 6

# 카테고리 점수를 소분류(cat3)와 중분류(cat2)에 나눠 주는 비율. 합이 1입니다.
CAT3_SCORE_RATIO = 0.7
CAT2_SCORE_RATIO = 0.3

GENDER_LABELS = {"male": "남성", "female": "여성"}


def has_final_consonant(word: str) -> bool:
    """한글 단어의 마지막 글자에 받침이 있는지 확인합니다. 조사 선택에 씁니다."""
    if not word:
        return False
    last = word[-1]
    if not ("가" <= last <= "힣"):
        return False
    return (ord(last) - ord("가")) % 28 != 0


def with_ieyo(word: str) -> str:
    """받침에 맞춰 '계곡이에요' / '폭포예요'를 만듭니다."""
    return f"{word}이에요" if has_final_consonant(word) else f"{word}예요"


@dataclass
class TasteProfile:
    """사용자(또는 코호트)의 활동 이력에서 뽑아낸 취향 벡터."""

    cat3: Counter = field(default_factory=Counter)
    cat2: Counter = field(default_factory=Counter)
    tags: Counter = field(default_factory=Counter)

    @property
    def has_category(self) -> bool:
        return bool(self.cat3) or bool(self.cat2)

    @property
    def has_tags(self) -> bool:
        return bool(self.tags)

    @property
    def is_empty(self) -> bool:
        return not self.has_category and not self.has_tags


@dataclass
class ScoredSpot:
    """점수와 추천 이유가 붙은 명소 한 건."""

    spot: TourSpot
    pins_count: int
    score: float
    reason: str
    distance_text: Optional[str] = None


class RecommendationService:
    def __init__(self):
        self.repo = TourSpotRepository()

    # ---------- 진입점 ----------

    def recommend(
        self,
        db: Session,
        user: Optional[User] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        limit: int = 5,
    ) -> tuple[list[ScoredSpot], str]:
        """추천 목록과 어떤 단계가 발동했는지를 함께 반환합니다."""
        coords = (lat, lng) if lat is not None and lng is not None else None
        taste, strategy = self._resolve_taste(db, user, coords)

        # 이미 다녀온 곳은 "갈 만한 곳"이 아니므로 후보에서 뺍니다.
        exclude_ids = self.repo.get_visited_spot_ids(db, user.id) if user else set()

        candidates = self._fetch_candidates(
            db,
            taste=taste,
            coords=coords,
            exclude_ids=exclude_ids,
            prefer_popularity=strategy in (STRATEGY_NEARBY, STRATEGY_POPULAR),
            limit=limit,
        )

        if not candidates:
            # 후보를 한 건도 못 구하면 기존 동작 그대로 무작위로 채웁니다.
            spots = self.repo.get_random_spots(db, limit=limit)
            return [self._random_result(spot) for spot in spots], STRATEGY_RANDOM

        tag_map = self.repo.get_spot_tag_map(db, [spot.id for spot, _ in candidates])
        scored = self._score_all(candidates, taste, coords, tag_map, strategy, user)
        scored.sort(key=lambda item: item.score, reverse=True)
        return self._diversify(scored, limit), strategy

    def _diversify(self, scored: list[ScoredSpot], limit: int) -> list[ScoredSpot]:
        """
        한 카테고리가 목록을 도배하지 않게 상한을 둡니다.

        점수순으로만 자르면 명소 수가 많은 카테고리가 목록을 독식합니다.
        예를 들어 공원과 강을 똑같이 좋아하는 사용자라도 공원(약 790곳)이
        강(약 130곳)보다 후보에 6배 많이 뽑히기 때문에 5개가 전부 공원이 됩니다.
        """
        if limit <= 2:
            return scored[:limit]

        per_category_cap = max(2, (limit + 1) // 2)
        counts: Counter = Counter()
        picked_indexes: list[int] = []

        for index, item in enumerate(scored):
            key = item.spot.cat3 or item.spot.cat2
            if counts[key] >= per_category_cap:
                continue
            counts[key] += 1
            picked_indexes.append(index)
            if len(picked_indexes) == limit:
                return [scored[i] for i in picked_indexes]

        # 카테고리가 몇 개 없어 상한만으로는 자리를 못 채우면 점수순으로 마저 채웁니다.
        taken = set(picked_indexes)
        for index in range(len(scored)):
            if len(picked_indexes) == limit:
                break
            if index not in taken:
                picked_indexes.append(index)

        picked_indexes.sort(key=lambda i: scored[i].score, reverse=True)
        return [scored[i] for i in picked_indexes]

    # ---------- 취향 벡터 ----------

    def _resolve_taste(
        self,
        db: Session,
        user: Optional[User],
        coords: Optional[tuple[float, float]],
    ) -> tuple[TasteProfile, str]:
        """개인 이력 → 코호트 → 위치 → 인기도 순으로 쓸 수 있는 신호를 찾습니다."""
        if user:
            personal = self._build_taste(db, [user.id])
            if not personal.is_empty:
                return personal, STRATEGY_PERSONAL

            cohort_ids = self.repo.get_cohort_user_ids(
                db, user.gender, user.age_group, exclude_user_id=user.id
            )
            cohort = self._build_taste(db, cohort_ids)
            if not cohort.is_empty:
                return cohort, STRATEGY_COHORT

        if coords:
            return TasteProfile(), STRATEGY_NEARBY
        return TasteProfile(), STRATEGY_POPULAR

    def _build_taste(self, db: Session, user_ids: list[int]) -> TasteProfile:
        if not user_ids:
            return TasteProfile()

        taste = TasteProfile()
        for cat2, cat3, count in self.repo.get_category_affinity(db, user_ids):
            if cat3:
                taste.cat3[cat3] += count
            if cat2:
                taste.cat2[cat2] += count
        for tag_name, count in self.repo.get_tag_affinity(db, user_ids):
            taste.tags[tag_name] += count
        return taste

    # ---------- 후보 조회 ----------

    def _fetch_candidates(
        self,
        db: Session,
        taste: TasteProfile,
        coords: Optional[tuple[float, float]],
        exclude_ids: set[int],
        prefer_popularity: bool,
        limit: int,
    ) -> list[tuple[TourSpot, int]]:
        """
        좁은 조건부터 시도하고, 후보가 모자라면 단계적으로 조건을 풉니다.
        전체 테이블을 긁지 않기 위해 매 시도마다 CANDIDATE_POOL로 상한을 둡니다.
        """
        bounds = self._bounds_for(coords) if coords else None
        top_cat3 = [code for code, _ in taste.cat3.most_common(TOP_CATEGORY_FILTER)]

        attempts: list[tuple[Optional[list[str]], Optional[tuple], set[int]]] = []
        if bounds and top_cat3:
            attempts.append((top_cat3, bounds, exclude_ids))
        if bounds:
            attempts.append((None, bounds, exclude_ids))
        if top_cat3:
            attempts.append((top_cat3, None, exclude_ids))
        attempts.append((None, None, exclude_ids))
        if exclude_ids:
            # 다녀온 곳을 빼고 나면 남는 게 없는 사용자를 위해 마지막엔 제외도 풉니다.
            attempts.append((None, None, set()))

        best: list[tuple[TourSpot, int]] = []
        for cat3_codes, box, excluded in attempts:
            rows = self.repo.get_scoring_candidates(
                db,
                cat3_codes=cat3_codes,
                bounds=box,
                exclude_spot_ids=excluded or None,
                order_by_popularity=prefer_popularity,
                limit=CANDIDATE_POOL,
            )
            if len(rows) >= limit:
                return rows
            if len(rows) > len(best):
                best = rows
        return best

    def _bounds_for(self, coords: tuple[float, float]) -> tuple[float, float, float, float]:
        lat, lng = coords
        return (
            lat - BOUND_DELTA_LAT,
            lat + BOUND_DELTA_LAT,
            lng - BOUND_DELTA_LNG,
            lng + BOUND_DELTA_LNG,
        )

    # ---------- 점수 ----------

    def _score_all(
        self,
        candidates: list[tuple[TourSpot, int]],
        taste: TasteProfile,
        coords: Optional[tuple[float, float]],
        tag_map: dict[int, set[str]],
        strategy: str,
        user: Optional[User],
    ) -> list[ScoredSpot]:
        weights = self._normalized_weights(taste, coords)

        popularity_raw = {
            spot.id: self._popularity_raw(spot, pins_count) for spot, pins_count in candidates
        }
        max_popularity = max(popularity_raw.values(), default=0) or 1

        max_cat3 = max(taste.cat3.values(), default=0)
        max_cat2 = max(taste.cat2.values(), default=0)
        max_tag = max(taste.tags.values(), default=0)

        results: list[ScoredSpot] = []
        for spot, pins_count in candidates:
            cat_score = self._category_score(spot, taste, max_cat3, max_cat2)
            spot_tags = tag_map.get(spot.id, set())
            tag_score, matched_tags = self._tag_score(spot_tags, taste, max_tag)
            distance_m = self._distance_m(spot, coords)
            distance_score = self._distance_score(distance_m)
            popularity_score = popularity_raw[spot.id] / max_popularity

            score = (
                weights["category"] * cat_score
                + weights["tag"] * tag_score
                + weights["distance"] * distance_score
                + weights["popularity"] * popularity_score
                + random.uniform(0, JITTER_MAX)
            )

            results.append(
                ScoredSpot(
                    spot=spot,
                    pins_count=pins_count,
                    score=round(score, 4),
                    reason=self._build_reason(
                        strategy=strategy,
                        user=user,
                        spot=spot,
                        pins_count=pins_count,
                        popularity_raw=popularity_raw[spot.id],
                        matched_tags=matched_tags,
                        cat_score=cat_score,
                        distance_m=distance_m,
                    ),
                    distance_text=format_distance(distance_m) if distance_m is not None else None,
                )
            )
        return results

    def _normalized_weights(
        self, taste: TasteProfile, coords: Optional[tuple[float, float]]
    ) -> dict[str, float]:
        """
        쓸 수 없는 신호의 가중치를 남은 신호에 비례 배분합니다.
        이걸 빠뜨리면 GPS를 거부한 사용자는 모든 후보의 점수가 똑같이 낮게 깔려
        순위가 사실상 무작위가 됩니다.
        """
        active: dict[str, float] = {"popularity": WEIGHT_POPULARITY}
        if taste.has_category:
            active["category"] = WEIGHT_CATEGORY
        if taste.has_tags:
            active["tag"] = WEIGHT_TAG
        if coords:
            active["distance"] = WEIGHT_DISTANCE

        total = sum(active.values())
        weights = {"category": 0.0, "tag": 0.0, "distance": 0.0, "popularity": 0.0}
        for key, value in active.items():
            weights[key] = value / total
        return weights

    def _category_score(
        self, spot: TourSpot, taste: TasteProfile, max_cat3: int, max_cat2: int
    ) -> float:
        """
        소분류(cat3)를 주로 보고 중분류(cat2)로 보정합니다.

        max(cat3, 0.5 * cat2)로 두면 안 됩니다. 이 서비스의 명소는 대부분
        A0101/A0102 둘 중 하나라 중분류가 거의 항상 맞고, 그러면 모든 후보의
        점수가 0.5 아래로 안 내려가면서 소분류 차이가 통째로 묻힙니다.
        """
        cat3_score = 0.0
        if max_cat3 and spot.cat3:
            cat3_score = taste.cat3.get(spot.cat3, 0) / max_cat3

        cat2_score = 0.0
        if max_cat2 and spot.cat2:
            cat2_score = taste.cat2.get(spot.cat2, 0) / max_cat2

        return CAT3_SCORE_RATIO * cat3_score + CAT2_SCORE_RATIO * cat2_score

    def _tag_score(
        self, spot_tags: set[str], taste: TasteProfile, max_tag: int
    ) -> tuple[float, list[str]]:
        if not spot_tags or not max_tag:
            return 0.0, []

        matched = [tag for tag in spot_tags if tag in taste.tags]
        if not matched:
            return 0.0, []

        # 가장 자주 찾은 태그가 걸리면 만점. 여러 개 걸리면 그만큼 가산하되 1로 자릅니다.
        weight = sum(taste.tags[tag] for tag in matched) / max_tag
        matched.sort(key=lambda tag: taste.tags[tag], reverse=True)
        return min(weight, 1.0), matched

    def _distance_m(
        self, spot: TourSpot, coords: Optional[tuple[float, float]]
    ) -> Optional[float]:
        if not coords or spot.mapy is None or spot.mapx is None:
            return None
        lat, lng = coords
        return haversine_meters(lat, lng, spot.mapy, spot.mapx)

    def _distance_score(self, distance_m: Optional[float]) -> float:
        if distance_m is None:
            return 0.0
        return 1.0 - min(distance_m / 1000 / MAX_DISTANCE_KM, 1.0)

    def _popularity_raw(self, spot: TourSpot, pins_count: int) -> int:
        """커뮤니티 '실시간 급상승 장소'와 같은 공식을 씁니다 (community_router.py)."""
        return (spot.previous_quarter_score or 0) + (spot.search_count or 0) + pins_count

    # ---------- 추천 이유 문구 ----------

    def _build_reason(
        self,
        strategy: str,
        user: Optional[User],
        spot: TourSpot,
        pins_count: int,
        popularity_raw: int,
        matched_tags: list[str],
        cat_score: float,
        distance_m: Optional[float],
    ) -> str:
        if strategy == STRATEGY_PERSONAL:
            if matched_tags:
                return f"#{matched_tags[0]} 좋아하시죠"
            if cat_score > 0:
                return f"자주 찾으신 {with_ieyo(format_category_name(spot.cat3 or spot.cat2))}"

        if strategy == STRATEGY_COHORT and user:
            gender = GENDER_LABELS.get(user.gender or "")
            if user.age_group and gender:
                return f"{user.age_group} {gender}이 많이 찾은 곳"
            if user.age_group:
                return f"{user.age_group}가 많이 찾은 곳"

        if distance_m is not None:
            return f"내 위치에서 {format_distance(distance_m)}"

        if pins_count > 0:
            return f"숨은 포인트 {pins_count}개 · 요즘 뜨는 곳"

        # 핀은 없지만 조회수·전 분기 점수로 상위에 오른 명소.
        # 여기서 popularity_raw를 안 보면 인기 1위가 '오늘의 새로운 발견'으로 표시됩니다.
        if popularity_raw > 0:
            return "요즘 많이 찾는 곳"

        return "오늘의 새로운 발견"

    def _random_result(self, spot: TourSpot) -> ScoredSpot:
        return ScoredSpot(
            spot=spot,
            pins_count=len(spot.pins) if spot.pins else 0,
            score=0.0,
            reason="오늘의 새로운 발견",
        )
