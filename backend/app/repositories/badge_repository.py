from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models import Badge, Pin, PinPhoto, Tag, UserBadge, Verification, pin_tags


class BadgeRepository:
    """
    뱃지 마스터/지급 기록의 DB 접근과, 뱃지 조건 판정에 필요한 집계 쿼리를 담당합니다.
    '몇 개를 모으면 지급인가' 같은 기준값은 Service 계층(badge_rules)이 정합니다.
    """

    # ---------- 마스터 / 지급 기록 ----------

    def get_all(self, db: Session) -> list[Badge]:
        return db.query(Badge).order_by(Badge.id).all()

    def get_by_code(self, db: Session, code: str) -> Badge | None:
        return db.query(Badge).filter(Badge.code == code).first()

    def get_user_badges(self, db: Session, user_id: int) -> list[UserBadge]:
        return (
            db.query(UserBadge)
            .options(selectinload(UserBadge.badge))
            .filter(UserBadge.user_id == user_id)
            .order_by(UserBadge.created_at.desc())
            .all()
        )

    def get_awarded_badge_ids(self, db: Session, user_id: int) -> set[int]:
        rows = db.query(UserBadge.badge_id).filter(UserBadge.user_id == user_id).all()
        return {row[0] for row in rows}

    def award(self, db: Session, user_id: int, badge_id: int) -> UserBadge:
        user_badge = UserBadge(user_id=user_id, badge_id=badge_id)
        db.add(user_badge)
        db.flush()  # commit은 호출한 서비스가 마지막에 한 번만 수행
        return user_badge

    # ---------- 뱃지 조건 집계 ----------

    def count_first_pins(self, db: Session, user_id: int) -> int:
        """유저가 등록한 핀 중, 그 명소의 1호 핀인 것의 개수."""
        first_pin_ids = db.query(func.min(Pin.id)).group_by(Pin.tour_spot_id).scalar_subquery()
        return (
            db.query(func.count(Pin.id))
            .filter(Pin.user_id == user_id, Pin.id.in_(first_pin_ids))
            .scalar()
            or 0
        )

    def count_spots_with_pins(self, db: Session, user_id: int, threshold: int) -> int:
        """유저가 핀을 threshold개 이상 등록한 명소의 개수."""
        spots = (
            db.query(Pin.tour_spot_id)
            .filter(Pin.user_id == user_id)
            .group_by(Pin.tour_spot_id)
            .having(func.count(Pin.id) >= threshold)
            .subquery()
        )
        return db.query(func.count()).select_from(spots).scalar() or 0

    def count_validated_pins(self, db: Session, user_id: int) -> int:
        """유저가 등록한 핀 중 EXIF 검증에 성공한 사진을 가진 핀의 개수."""
        return (
            db.query(func.count(func.distinct(Pin.id)))
            .join(PinPhoto, PinPhoto.pin_id == Pin.id)
            .filter(Pin.user_id == user_id, PinPhoto.is_validated.is_(True))
            .scalar()
            or 0
        )

    def count_verifications(self, db: Session, user_id: int) -> int:
        return db.query(func.count(Verification.id)).filter(Verification.user_id == user_id).scalar() or 0

    def count_verifications_with_tags(self, db: Session, user_id: int, tag_names: list[str]) -> int:
        """특정 경험 태그가 붙은 핀을 방문 인증한 횟수."""
        if not tag_names:
            return 0
        return (
            db.query(func.count(func.distinct(Verification.id)))
            .join(Pin, Pin.id == Verification.pin_id)
            .join(pin_tags, pin_tags.c.pin_id == Pin.id)
            .join(Tag, Tag.id == pin_tags.c.tag_id)
            .filter(Verification.user_id == user_id, Tag.name.in_(tag_names))
            .scalar()
            or 0
        )
