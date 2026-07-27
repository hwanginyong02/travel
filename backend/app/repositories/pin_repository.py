from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func
from app.models import Pin, PinPhoto, Tag


class PinRepository:
    """핀 관련 DB 접근만 담당합니다. 비즈니스 판단(EXIF 검증, 블러 등)은 Service 계층의 몫입니다."""

    def _base_query(self, db: Session):
        return db.query(Pin).options(
            selectinload(Pin.tags),
            selectinload(Pin.photos),
            selectinload(Pin.user),
            selectinload(Pin.tour_spot),      # tour_spot_title 표기 시 N+1 방지
            selectinload(Pin.verifications),  # verification_count 집계 시 N+1 방지
        )

    def get_by_id(self, db: Session, pin_id: int) -> Pin:
        return self._base_query(db).filter(Pin.id == pin_id).first()

    def get_by_spot(
        self,
        db: Session,
        tour_spot_id: int,
        sort: str = "popular",
        skip: int = 0,
        limit: int = 50,
    ) -> list[Pin]:
        q = self._base_query(db).filter(Pin.tour_spot_id == tour_spot_id)

        # created_at은 초 단위라 같은 시각에 등록된 핀끼리 순서가 흔들립니다.
        # id를 보조 정렬 키로 두어 정렬 결과를 항상 결정적으로 만듭니다.
        if sort == "latest":
            q = q.order_by(Pin.created_at.desc(), Pin.id.desc())
        else:  # popular
            q = q.order_by(Pin.reliability_score.desc(), Pin.created_at.desc(), Pin.id.desc())

        return q.offset(skip).limit(limit).all()

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[Pin]:
        return (
            self._base_query(db)
            .filter(Pin.user_id == user_id)
            .order_by(Pin.created_at.desc(), Pin.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_spot(self, db: Session, tour_spot_id: int) -> int:
        return db.query(func.count(Pin.id)).filter(Pin.tour_spot_id == tour_spot_id).scalar() or 0

    def count_by_user(self, db: Session, user_id: int) -> int:
        return db.query(func.count(Pin.id)).filter(Pin.user_id == user_id).scalar() or 0

    def create(self, db: Session, pin_data: dict, tags: list[Tag]) -> Pin:
        pin = Pin(**pin_data)
        pin.tags = tags
        db.add(pin)
        db.flush()  # 사진 저장에 필요한 pin.id 확보 (commit은 서비스가 마지막에 한 번만)
        return pin

    def add_photo(self, db: Session, photo_data: dict) -> PinPhoto:
        photo = PinPhoto(**photo_data)
        db.add(photo)
        db.flush()
        return photo

    def get_or_create_tags(self, db: Session, names: list[str]) -> list[Tag]:
        """이름으로 태그를 찾고, 없으면 새로 만듭니다."""
        if not names:
            return []

        existing = db.query(Tag).filter(Tag.name.in_(names)).all()
        found = {tag.name: tag for tag in existing}

        result = []
        for name in names:
            tag = found.get(name)
            if not tag:
                tag = Tag(name=name, is_danger=False)
                db.add(tag)
                db.flush()
                found[name] = tag
            result.append(tag)
        return result

    def get_danger_tags(self, db: Session) -> list[Tag]:
        return db.query(Tag).filter(Tag.is_danger.is_(True)).all()
