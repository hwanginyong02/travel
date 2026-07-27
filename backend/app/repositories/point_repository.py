from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models import PointTransaction


class PointRepository:
    """포인트 적립 내역의 DB 접근만 담당합니다. 지급 금액 판단은 Service 계층의 몫입니다."""

    def create(self, db: Session, transaction_data: dict) -> PointTransaction:
        transaction = PointTransaction(**transaction_data)
        db.add(transaction)
        db.flush()  # commit은 호출한 서비스가 마지막에 한 번만 수행
        return transaction

    def list_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[PointTransaction]:
        return (
            db.query(PointTransaction)
            .options(selectinload(PointTransaction.pin))
            .filter(PointTransaction.user_id == user_id)
            .order_by(PointTransaction.created_at.desc(), PointTransaction.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def sum_by_user(self, db: Session, user_id: int) -> int:
        return (
            db.query(func.coalesce(func.sum(PointTransaction.amount), 0))
            .filter(PointTransaction.user_id == user_id)
            .scalar()
            or 0
        )

    def existing_keys(self, db: Session) -> set[tuple[int, str, int | None, int | None]]:
        """
        (user_id, reason, pin_id, verification_id) 조합 전체를 반환합니다.
        백필 스크립트가 이미 지급한 건을 건너뛰어 중복 적립을 막는 데 씁니다.
        """
        rows = db.query(
            PointTransaction.user_id,
            PointTransaction.reason,
            PointTransaction.pin_id,
            PointTransaction.verification_id,
        ).all()
        return {tuple(row) for row in rows}
