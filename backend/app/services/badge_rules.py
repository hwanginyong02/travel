"""
뱃지 지급 조건 정의. 순수 정의만 두고 실제 집계 쿼리는 BadgeRepository에 위임합니다.

새 뱃지를 추가하려면 여기에 정의 한 줄을 더하고
`python -m app.scripts.seed_badges` 를 실행하면 됩니다.
"""
from dataclasses import dataclass
from typing import Callable

from sqlalchemy.orm import Session

from app.repositories import BadgeRepository

# '물멍 고수' 판정에 쓰는 물가 계열 경험 태그
WATER_TAG_NAMES = ["물멍벤치", "수심주의", "계곡", "물멍"]


@dataclass(frozen=True)
class BadgeDefinition:
    code: str
    name: str
    description: str
    icon: str                                              # 이모지
    goal: int                                              # 달성에 필요한 수치
    counter: Callable[[BadgeRepository, Session, int], int]  # 현재 진행 수치


BADGE_DEFINITIONS: list[BadgeDefinition] = [
    BadgeDefinition(
        code="PIONEER",
        name="첫 발견자 (Pioneer)",
        description="아무도 등록하지 않은 자연 속 숨은 미시 좌표 1호 핀을 성공적으로 발굴해 냈을 때 수여받는 개척자 뱃지입니다.",
        icon="⛺",
        goal=1,
        counter=lambda repo, db, user_id: repo.count_first_pins(db, user_id),
    ),
    BadgeDefinition(
        code="LOCAL_MASTER",
        name="지역 마스터 (Local Master)",
        description="한 명소 안의 숨은 좌표를 5개 이상 신규 발굴했을 때 수여받는 그 지역의 터줏대감 뱃지입니다.",
        icon="🌲",
        goal=1,
        counter=lambda repo, db, user_id: repo.count_spots_with_pins(db, user_id, threshold=5),
    ),
    BadgeDefinition(
        code="EXPLORER",
        name="산악인 (Explorer)",
        description="다른 사용자가 등록한 숨은 명당 핀을 10곳 이상 직접 방문 인증했을 때 주어지는 뱃지입니다.",
        icon="⛰️",
        goal=10,
        counter=lambda repo, db, user_id: repo.count_verifications(db, user_id),
    ),
    BadgeDefinition(
        code="WATER_MEDITATION",
        name="물멍 고수 (Water Meditation)",
        description="물소리가 들리는 계곡·강·바다 벤치 핀을 5회 이상 방문 인증해 주신 평화주의 유저용 뱃지입니다.",
        icon="🌊",
        goal=5,
        counter=lambda repo, db, user_id: repo.count_verifications_with_tags(db, user_id, WATER_TAG_NAMES),
    ),
    BadgeDefinition(
        code="PHOTOGRAPHER",
        name="내셔널 지오그래픽 (Photographer)",
        description="직접 첨부한 사진의 GPS(EXIF) 검증이 완료된 핀을 20개 이상 등록했을 때 지급됩니다.",
        icon="📸",
        goal=20,
        counter=lambda repo, db, user_id: repo.count_validated_pins(db, user_id),
    ),
]

BADGE_DEFINITIONS_BY_CODE = {definition.code: definition for definition in BADGE_DEFINITIONS}
