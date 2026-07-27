from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class BadgeBriefResponse(BaseModel):
    """새로 획득한 뱃지를 알릴 때 쓰는 최소 정보."""
    code: Optional[str] = None
    name: str
    icon: str


class RewardResponse(BaseModel):
    """핀 등록·방문 인증 직후 사용자에게 보여줄 보상 결과."""
    points_awarded: int
    total_points: int
    level: int
    new_badges: List[BadgeBriefResponse] = []

    @classmethod
    def from_reward(cls, reward) -> "RewardResponse":
        return cls(
            points_awarded=reward.points_awarded,
            total_points=reward.total_points,
            level=reward.level,
            new_badges=[
                BadgeBriefResponse(code=badge.code, name=badge.name, icon=badge.icon_url)
                for badge in reward.new_badges
            ],
        )


class BadgeProgressResponse(BaseModel):
    """뱃지 하나의 획득 여부와 진행 수치. 잠긴 뱃지는 current/goal로 진행도를 표시합니다."""
    code: str
    name: str
    description: str
    icon: str
    goal: int
    current: int
    is_unlocked: bool
    awarded_at: Optional[datetime] = None

    @classmethod
    def from_progress(cls, progress) -> "BadgeProgressResponse":
        definition = progress.definition
        return cls(
            code=definition.code,
            name=definition.name,
            description=definition.description,
            icon=definition.icon,
            goal=definition.goal,
            current=progress.current,
            is_unlocked=progress.is_unlocked,
            awarded_at=progress.awarded_at,
        )


class PointTransactionResponse(BaseModel):
    """포인트 적립 한 건. label/description은 서비스의 적립 사유 정의에서 가져옵니다."""
    id: int
    amount: int
    reason: str
    label: str
    description: str
    pin_id: Optional[int] = None
    pin_title: Optional[str] = None
    created_at: datetime

    @classmethod
    def from_transaction(cls, transaction, reason) -> "PointTransactionResponse":
        return cls(
            id=transaction.id,
            amount=transaction.amount,
            reason=transaction.reason,
            label=reason.label,
            description=reason.description,
            pin_id=transaction.pin_id,
            pin_title=transaction.pin.title if transaction.pin else None,
            created_at=transaction.created_at,
        )


class PointHistoryResponse(BaseModel):
    total_points: int
    level: int
    items: List[PointTransactionResponse] = []


class RecentPinResponse(BaseModel):
    """프로필의 '내가 등록한 핀' 썸네일 줄에 쓰는 최소 정보."""
    id: int
    title: str
    photo_url: Optional[str] = None


class RecentSpotResponse(BaseModel):
    """프로필의 '최근 방문 장소' 카드."""
    id: int
    title: str
    firstimage: Optional[str] = None
    mapx: float
    mapy: float


class ProfileSummaryResponse(BaseModel):
    """'내 활동 및 챌린지' 첫 화면을 한 번의 호출로 채우기 위한 응답."""
    nickname: str
    profile_image: Optional[str] = None
    points: int
    level: int
    progress_percent: int
    points_to_next_level: int
    pins_count: int
    verifications_count: int
    badges: List[BadgeProgressResponse] = []
    recent_pins: List[RecentPinResponse] = []
    recent_spot: Optional[RecentSpotResponse] = None
