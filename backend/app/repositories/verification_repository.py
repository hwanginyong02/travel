from sqlalchemy.orm import Session, selectinload

from app.models import Verification


class VerificationRepository:
    """방문 인증 관련 DB 접근만 담당합니다. 신뢰도 계산은 Service 계층의 몫입니다."""

    def _base_query(self, db: Session):
        return db.query(Verification).options(selectinload(Verification.user))

    def get_by_pin(self, db: Session, pin_id: int, skip: int = 0, limit: int = 50) -> list[Verification]:
        return (
            self._base_query(db)
            .filter(Verification.pin_id == pin_id)
            .order_by(Verification.created_at.desc(), Verification.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def exists_by_user_and_pin(self, db: Session, user_id: int, pin_id: int) -> bool:
        return (
            db.query(Verification.id)
            .filter(Verification.user_id == user_id, Verification.pin_id == pin_id)
            .first()
            is not None
        )

    def create(self, db: Session, verification_data: dict) -> Verification:
        verification = Verification(**verification_data)
        db.add(verification)
        db.flush()  # commit은 서비스가 마지막에 한 번만 수행
        return verification
