"""
명소 키워드 검색의 매칭과 랭킹을 담당합니다.

기존 검색은 title에 대한 ILIKE 부분 일치 한 줄이 전부였고 정렬이 없었습니다.
그래서 "공원"으로 검색하면 제목에 '공원'이 든 명소만, 그것도 DB가 돌려주는
임의의 순서로 나왔습니다.

여기서는 제목 외에 개요·카테고리 한글명·경험 태그까지 매칭하고, 일치 강도에
따라 점수를 매겨 정렬합니다.
"""
import math
import re
from typing import Optional

from app.models import TourSpot
from app.services.category_service import matches_category

# 일치 강도별 기본 점수
SCORE_TITLE_EXACT = 100
SCORE_TITLE_PREFIX = 80
SCORE_TITLE_CONTAINS = 60
SCORE_TAG = 50
SCORE_CATEGORY = 40
SCORE_OVERVIEW = 20

# 같은 강도로 걸린 명소들 사이의 순서를 정하는 보정치.
# 상한을 두는 이유는 인기도가 제목 일치를 뒤집지 못하게 하기 위해서입니다.
POPULARITY_BONUS_MAX = 10.0


def normalize(text: Optional[str]) -> str:
    """
    비교용으로 문자열을 정규화합니다.
    공백을 모두 제거해 '남산 공원'으로 '남산공원'을 찾을 수 있게 합니다.
    """
    if not text:
        return ""
    return re.sub(r"\s+", "", text.strip().lower())


def _title_score(title_n: str, query_n: str) -> int:
    if not title_n or not query_n:
        return 0
    if title_n == query_n:
        return SCORE_TITLE_EXACT
    if title_n.startswith(query_n):
        return SCORE_TITLE_PREFIX
    if query_n in title_n:
        return SCORE_TITLE_CONTAINS
    return 0


def _tag_score(spot_tags: set[str], query_n: str) -> int:
    for tag in spot_tags:
        tag_n = normalize(tag)
        if not tag_n:
            continue
        if query_n in tag_n or tag_n in query_n:
            return SCORE_TAG
    return 0


def _popularity_bonus(spot: TourSpot, pins_count: int) -> float:
    raw = (spot.previous_quarter_score or 0) + (spot.search_count or 0) + pins_count
    if raw <= 0:
        return 0.0
    return min(math.log1p(raw) * 3, POPULARITY_BONUS_MAX)


def score_spot(spot: TourSpot, query: str, spot_tags: set[str], pins_count: int) -> float:
    """
    명소 하나의 검색 점수. 0이면 검색 결과에서 제외됩니다.
    여러 필드에 동시에 걸리면 점수가 합산되어 위로 올라갑니다.
    """
    query_n = normalize(query)
    if not query_n:
        return 0.0

    score = 0
    score += _title_score(normalize(spot.title), query_n)
    score += _tag_score(spot_tags, query_n)

    if matches_category(query, [spot.cat1, spot.cat2, spot.cat3]):
        score += SCORE_CATEGORY

    # overview는 대량 동기화 때 건너뛰고 상세 조회 시점에 채워지므로 대부분 비어 있습니다.
    if spot.overview and query_n in normalize(spot.overview):
        score += SCORE_OVERVIEW

    if score == 0:
        return 0.0

    return score + _popularity_bonus(spot, pins_count)


def rank_spots(
    spots: list[TourSpot],
    query: str,
    tag_map: dict[int, set[str]],
    limit: Optional[int] = None,
) -> list[TourSpot]:
    """검색어에 걸리는 명소만 남겨 점수 내림차순으로 정렬합니다."""
    if not query or not query.strip():
        return spots[:limit] if limit else spots

    scored: list[tuple[float, TourSpot]] = []
    for spot in spots:
        pins_count = len(spot.pins) if spot.pins is not None else 0
        score = score_spot(spot, query, tag_map.get(spot.id, set()), pins_count)
        if score > 0:
            scored.append((score, spot))

    scored.sort(key=lambda item: item[0], reverse=True)
    ranked = [spot for _, spot in scored]
    return ranked[:limit] if limit else ranked
