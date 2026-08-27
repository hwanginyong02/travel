"""
TourAPI 카테고리 코드(cat1/cat2/cat3)를 사람이 읽고 검색할 수 있는 한글로 옮깁니다.

이 프로젝트는 TourAPI 원본 코드를 그대로 쓰지 않고 동기화 시점에 자체 코드 체계로
한번 접습니다. 매핑 근거는 `services/tour_api_service.py`의 `API_TO_DB_CAT3`이며,
표시명도 그 주석을 그대로 따릅니다.
"""
from typing import Iterable, Optional

# ---------- 대분류 / 중분류 ----------
# 기존 community_router.format_category_name 의 매핑을 그대로 옮겨 왔습니다.
PARENT_CATEGORY_NAMES = {
    "A01": "자연 명소",
    "A0101": "자연관광지",
    "A0102": "관광자원",
    "A02": "인문 명소",
    "A0201": "역사관광지",
    "A0202": "휴양관광지",
    "A0203": "체험관광지",
}

DEFAULT_CATEGORY_NAME = "자연 명소"


# ---------- 소분류(cat3) ----------
# 앞의 4개는 tour_api_service.API_TO_DB_CAT3 이 명시적으로 만들어 내는 코드이고,
# 나머지는 매핑되지 않아 TourAPI 원본 코드 그대로 저장되는 A01 계열입니다.
# 라벨은 추측이 아니라 동기화된 실제 데이터의 제목을 표본 확인해 붙였습니다.
# TourAPI 공식 코드표의 순번과 어긋나는 항목이 있어(A01011400·A01011800 등)
# 코드 번호만 보고 유추하면 틀립니다. 코드가 추가되면 아래처럼 확인하세요.
#   SELECT title FROM tour_spots WHERE cat3='A0101xxxx' LIMIT 10;
CAT3_NAMES = {
    # 동기화 시 재매핑되는 코드 (tour_api_service.py:36-42)
    "A01020600": "기암괴석",     # 거북바위, 주상절리, 현무암
    "A01020500": "등대",
    "A01020400": "약수터",       # 안보/역사 공원(A02011000)도 이 코드로 접힙니다 (현충원·호국원)
    "A01011300": "공원",         # 일반/테마 공원(A02020700)이 이 코드로 접힙니다
                                 # 주의: TourAPI 원본 '섬'(가거도·거문도)도 같은 코드라 섞여 있습니다
    # 재매핑 없이 통과하는 TourAPI A01 원본 코드
    "A01010100": "국립공원",
    "A01010200": "도립공원",
    "A01010300": "군립공원",     # 시립공원 포함
    "A01010400": "산",           # 제주 오름 포함
    "A01010500": "자연생태관광지",  # 습지·생태공원
    "A01010600": "자연휴양림",   # 산림욕장 포함
    "A01010700": "수목원",       # 정원·메타세쿼이아길
    "A01010800": "폭포",
    "A01010900": "계곡",
    "A01011100": "해안절경",     # 주상절리·해안 탐방로
    "A01011200": "해수욕장",     # 해변 포함
    "A01011400": "항구",         # 항·포구·선착장 (강 아님)
    "A01011700": "호수",         # 호·저수지
    "A01011800": "강",           # 하천·저수지 (동굴 아님)
    "A01011900": "동굴",
    "A01020100": "희귀동식물",   # 노거수·천연기념물 수목
}

# 검색어 매칭용 별칭. 표시명 하나로는 놓치는 자연어 표현을 보완합니다.
# "공원"으로 검색하면 국립/도립/군립공원까지 잡히도록 상위 키워드를 함께 넣습니다.
CAT3_SEARCH_ALIASES = {
    "A01011300": ("공원", "테마공원", "섬"),  # 코드 충돌: 일반/테마공원과 TourAPI 원본 '섬'이 같은 코드
    "A01010100": ("공원", "국립공원"),
    "A01010200": ("공원", "도립공원"),
    "A01010300": ("공원", "군립공원", "시립공원"),
    "A01020400": ("약수터", "약수", "안보공원", "현충원", "호국원"),
    "A01010600": ("자연휴양림", "휴양림", "산림욕장", "숲"),
    "A01010700": ("수목원", "정원", "숲"),
    "A01010400": ("등산", "오름"),
    "A01010500": ("자연생태관광지", "생태", "습지"),
    "A01010900": ("계곡", "물놀이"),
    "A01010800": ("폭포",),
    "A01011200": ("해수욕장", "해변", "바다"),
    "A01011100": ("해안절경", "해안", "절경", "주상절리", "바다"),
    "A01011400": ("항구", "포구", "선착장"),
    "A01011700": ("호수", "저수지"),
    "A01011800": ("하천", "저수지"),
    "A01011900": ("동굴",),
    "A01020100": ("희귀동식물", "노거수", "천연기념물"),
    "A01020600": ("기암괴석", "바위", "주상절리"),
}


def format_category_name(cat_code: Optional[str]) -> str:
    """
    카테고리 코드를 직관적인 한글 카테고리로 변환합니다.
    cat1/cat2/cat3 중 무엇을 넘겨도 동작하며, 모르는 코드는 기본값으로 떨어집니다.
    """
    if not cat_code:
        return DEFAULT_CATEGORY_NAME

    code = cat_code.strip()
    if code in CAT3_NAMES:
        return CAT3_NAMES[code]
    return PARENT_CATEGORY_NAMES.get(code, DEFAULT_CATEGORY_NAME)


def category_search_keywords(
    cat1: Optional[str] = None,
    cat2: Optional[str] = None,
    cat3: Optional[str] = None,
) -> set[str]:
    """
    명소 하나가 카테고리로 매칭될 수 있는 검색 키워드 전부를 반환합니다.
    검색어가 이 중 하나에 걸리면 제목에 그 단어가 없어도 결과에 포함됩니다.
    """
    keywords: set[str] = set()
    for code in (cat1, cat2, cat3):
        if not code:
            continue
        code = code.strip()
        if code in CAT3_NAMES:
            keywords.add(CAT3_NAMES[code])
        elif code in PARENT_CATEGORY_NAMES:
            keywords.add(PARENT_CATEGORY_NAMES[code])
        keywords.update(CAT3_SEARCH_ALIASES.get(code, ()))
    return keywords


def matches_category(query: str, codes: Iterable[Optional[str]]) -> bool:
    """
    검색어가 주어진 카테고리 코드들의 한글명/별칭 중 하나에 걸리는지 확인합니다.

    검색어가 키워드와 같거나, 키워드의 앞부분인 경우에만 인정합니다
    ("공원" → 국립공원·도립공원·테마공원 / "국립" → 국립공원).

    반대 방향(키워드가 검색어 안에 들어 있는 경우)은 일부러 보지 않습니다.
    '산', '강', '섬' 같은 한 글자 카테고리가 '남산공원' 같은 고유명사에
    전부 걸려 버려서, 특정 장소를 찾는 검색이 카테고리 전체로 오염됩니다.
    """
    if not query:
        return False
    normalized = query.strip()
    if len(normalized) < 2:
        return False

    cat1, cat2, cat3 = (list(codes) + [None, None, None])[:3]
    for keyword in category_search_keywords(cat1, cat2, cat3):
        if normalized == keyword or keyword.startswith(normalized):
            return True
    return False
