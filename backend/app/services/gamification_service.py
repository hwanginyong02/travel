"""
포인트·레벨·뱃지 지급의 단일 출처.

지급 금액과 화면에 보일 문구를 POINT_REASONS 한 곳에서 관리해
'얼마를 줬는지'와 '내역에 뭐라고 쓸지'가 어긋나지 않게 합니다.
이 서비스는 절대 commit 하지 않습니다. 호출한 서비스의 트랜잭션에 얹혀
핀/인증과 포인트가 항상 함께 저장되거나 함께 취소되도록 하기 위함입니다.
"""
import logging
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Badge, Pin, PointTransaction, TourSpot, User
from app.repositories import BadgeRepository, PinRepository, PointRepository, VerificationRepository
from app.services.badge_rules import BADGE_DEFINITIONS, BadgeDefinition

logger = logging.getLogger(__name__)

# 레벨업에 필요한 포인트. 100P마다 1레벨씩 오릅니다.
LEVEL_STEP_POINTS = 100


@dataclass(frozen=True)
class PointReason:
    """포인트 적립 사유 하나. 지급 금액과 내역 표시 문구를 함께 들고 있습니다."""
    code: str
    amount: int
    label: str        # 내역 화면의 제목 (예: '핀 등록 보상')
    description: str  # 내역 화면의 설명 줄


REASON_PIN_CREATE = "PIN_CREATE"
REASON_PIN_CREATE_VALIDATED = "PIN_CREATE_VALIDATED"
REASON_VERIFY = "VERIFY"
REASON_VERIFY_VALIDATED = "VERIFY_VALIDATED"
REASON_PIN_VERIFIED_BY_OTHER = "PIN_VERIFIED_BY_OTHER"

POINT_REASONS: dict[str, PointReason] = {
    reason.code: reason
    for reason in [
        PointReason(REASON_PIN_CREATE, 100, "핀 등록 보상", "새로운 숨은 좌표 발굴 보상"),
        PointReason(REASON_PIN_CREATE_VALIDATED, 150, "핀 등록 보상", "현장 사진 EXIF 검증까지 통과한 숨은 좌표 발굴 보상"),
        PointReason(REASON_VERIFY, 30, "방문 인증", '다른 사람이 등록한 핀의 "지금도 그대로인가요?" 응답'),
        PointReason(REASON_VERIFY_VALIDATED, 50, "방문 인증", "현장 사진 EXIF 검증까지 완료된 방문 인증"),
        PointReason(REASON_PIN_VERIFIED_BY_OTHER, 20, "인증 획득", "내가 등록한 핀을 다른 사람이 방문 인증"),
    ]
}


@dataclass
class Reward:
    """한 번의 행동으로 얻은 보상. 등록/인증 직후 사용자에게 바로 알려주기 위한 값입니다."""
    points_awarded: int = 0
    total_points: int = 0
    level: int = 1
    new_badges: list[Badge] = field(default_factory=list)


@dataclass
class BadgeProgress:
    """뱃지 하나의 획득 여부와 진행 수치."""
    definition: BadgeDefinition
    is_unlocked: bool
    current: int
    awarded_at: datetime | None = None


@dataclass
class ProfileSummary:
    """'내 활동 및 챌린지' 화면 한 장을 채우는 데 필요한 값 묶음."""
    points: int
    level: int
    progress_percent: int
    points_to_next_level: int
    pins_count: int
    verifications_count: int
    badges: list[BadgeProgress]
    recent_pins: list[Pin]
    recent_spot: TourSpot | None


class GamificationService:
    """
    핀 등록·방문 인증에 대한 포인트 지급, 레벨 갱신, 뱃지 판정을 담당합니다.
    HTTP 요청/응답 형태는 알지 못합니다.
    """

    def __init__(self):
        self.points = PointRepository()
        self.badges = BadgeRepository()
        self.pins = PinRepository()
        self.verifications = VerificationRepository()

    # ---------- 레벨 ----------

    def level_of(self, points: int) -> int:
        return max(points, 0) // LEVEL_STEP_POINTS + 1

    def progress_percent(self, points: int) -> int:
        return max(points, 0) % LEVEL_STEP_POINTS

    def points_to_next_level(self, points: int) -> int:
        return LEVEL_STEP_POINTS - self.progress_percent(points)

    # ---------- 지급 ----------

    def _grant(
        self,
        db: Session,
        user: User,
        reason_code: str,
        pin_id: int | None = None,
        verification_id: int | None = None,
    ) -> int:
        """포인트 한 건을 적립하고 사용자의 누적 포인트/레벨을 갱신합니다."""
        reason = POINT_REASONS[reason_code]

        self.points.create(
            db,
            {
                "user_id": user.id,
                "amount": reason.amount,
                "reason": reason.code,
                "pin_id": pin_id,
                "verification_id": verification_id,
            },
        )

        user.points = (user.points or 0) + reason.amount
        user.level = self.level_of(user.points)
        return reason.amount

    def award_pin_created(self, db: Session, user: User, pin: Pin, exif_validated: bool) -> Reward:
        """핀 등록 보상. EXIF 검증에 성공하면 더 많은 포인트를 지급합니다."""
        reason_code = REASON_PIN_CREATE_VALIDATED if exif_validated else REASON_PIN_CREATE
        awarded = self._grant(db, user, reason_code, pin_id=pin.id)
        new_badges = self.evaluate_badges(db, user.id)
        return Reward(
            points_awarded=awarded,
            total_points=user.points,
            level=user.level,
            new_badges=new_badges,
        )

    def award_verification(
        self,
        db: Session,
        user: User,
        pin: Pin,
        verification_id: int,
        is_still_there: bool,
        photo_validated: bool,
    ) -> Reward:
        """
        방문 인증 보상. 인증한 사람에게 지급하고,
        '그대로예요' 응답일 때는 핀 등록자에게도 보상을 나눠 줍니다.
        """
        reason_code = REASON_VERIFY_VALIDATED if photo_validated else REASON_VERIFY
        awarded = self._grant(db, user, reason_code, pin_id=pin.id, verification_id=verification_id)
        new_badges = self.evaluate_badges(db, user.id)

        if is_still_there and pin.user_id != user.id:
            owner = db.get(User, pin.user_id)
            if owner:
                self._grant(
                    db,
                    owner,
                    REASON_PIN_VERIFIED_BY_OTHER,
                    pin_id=pin.id,
                    verification_id=verification_id,
                )
                self.evaluate_badges(db, owner.id)

        return Reward(
            points_awarded=awarded,
            total_points=user.points,
            level=user.level,
            new_badges=new_badges,
        )

    # ---------- 뱃지 ----------

    def evaluate_badges(self, db: Session, user_id: int) -> list[Badge]:
        """
        모든 뱃지 조건을 다시 계산해, 아직 없는 것 중 달성한 뱃지를 지급합니다.
        증분 판정 대신 매번 전체를 재계산해 조건이 바뀌어도 결과가 일관되게 합니다.
        """
        awarded_ids = self.badges.get_awarded_badge_ids(db, user_id)
        newly_awarded: list[Badge] = []

        for definition in BADGE_DEFINITIONS:
            badge = self.badges.get_by_code(db, definition.code)
            if not badge:
                # 시딩되지 않은 뱃지는 건너뜁니다. (python -m app.scripts.seed_badges)
                logger.warning("뱃지 %s 가 시딩되지 않아 지급을 건너뜁니다.", definition.code)
                continue
            if badge.id in awarded_ids:
                continue
            if definition.counter(self.badges, db, user_id) >= definition.goal:
                self.badges.award(db, user_id, badge.id)
                newly_awarded.append(badge)

        return newly_awarded

    def get_badge_progress(self, db: Session, user_id: int) -> list[BadgeProgress]:
        """획득/미획득 뱃지 전체와 진행 수치를 반환합니다."""
        user_badges = {ub.badge_id: ub for ub in self.badges.get_user_badges(db, user_id)}

        result: list[BadgeProgress] = []
        for definition in BADGE_DEFINITIONS:
            badge = self.badges.get_by_code(db, definition.code)
            user_badge = user_badges.get(badge.id) if badge else None
            is_unlocked = user_badge is not None
            # 이미 획득한 뱃지는 진행도를 다시 세지 않고 목표치로 고정합니다.
            current = definition.goal if is_unlocked else definition.counter(self.badges, db, user_id)

            result.append(
                BadgeProgress(
                    definition=definition,
                    is_unlocked=is_unlocked,
                    current=min(current, definition.goal),
                    awarded_at=user_badge.created_at if user_badge else None,
                )
            )
        return result

    # ---------- 조회 ----------

    def get_point_history(self, db: Session, user_id: int, limit: int = 50) -> list[PointTransaction]:
        return self.points.list_by_user(db, user_id, limit=limit)

    def get_summary(self, db: Session, user: User, recent_pin_limit: int = 5) -> ProfileSummary:
        """프로필 첫 화면에 필요한 값을 한 번에 모아 옵니다."""
        recent_pins = self.pins.get_by_user(db, user.id, limit=recent_pin_limit)

        # 최근 방문 장소는 마지막 인증 기록을 우선하고, 없으면 마지막으로 등록한 핀의 명소를 씁니다.
        latest_verification = self.verifications.get_latest_by_user(db, user.id)
        if latest_verification and latest_verification.pin:
            recent_spot = latest_verification.pin.tour_spot
        else:
            recent_spot = recent_pins[0].tour_spot if recent_pins else None

        points = user.points or 0
        return ProfileSummary(
            points=points,
            level=self.level_of(points),
            progress_percent=self.progress_percent(points),
            points_to_next_level=self.points_to_next_level(points),
            pins_count=self.pins.count_by_user(db, user.id),
            verifications_count=self.badges.count_verifications(db, user.id),
            badges=self.get_badge_progress(db, user.id),
            recent_pins=recent_pins,
            recent_spot=recent_spot,
        )

    def describe_reason(self, reason_code: str) -> PointReason:
        """알 수 없는 사유도 화면이 깨지지 않도록 기본 문구로 대체합니다."""
        return POINT_REASONS.get(
            reason_code,
            PointReason(reason_code, 0, "포인트 적립", "적립 내역"),
        )
