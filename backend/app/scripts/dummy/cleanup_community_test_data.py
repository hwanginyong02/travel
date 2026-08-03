"""
커뮤니티 시드 테스트 데이터를 깔끔하게 삭제하고 DB를 원상복구하는 원복 스크립트.

실행 방법:
python app/scripts/dummy/cleanup_community_test_data.py
"""
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, TourSpot, Pin, Verification, PinPhoto

TEST_USER_PREFIX = "[TEST_SEED]"

def main():
    db: Session = SessionLocal()
    try:
        print("[1/3] 커뮤니티 테스트 데이터 원복/정리 시작...")

        # 1. 테스트 사용자가 생성한 핀 및 인증 데이터 삭제
        test_users = db.query(User).filter(User.nickname.like(f"{TEST_USER_PREFIX}%")).all()
        test_user_ids = [u.id for u in test_users]

        if test_user_ids:
            test_pins = db.query(Pin).filter(Pin.user_id.in_(test_user_ids)).all()
            test_pin_ids = [p.id for p in test_pins]

            if test_pin_ids:
                db.query(Verification).filter(Verification.pin_id.in_(test_pin_ids)).delete(synchronize_session=False)
                db.query(PinPhoto).filter(PinPhoto.pin_id.in_(test_pin_ids)).delete(synchronize_session=False)
                deleted_pins_count = db.query(Pin).filter(Pin.id.in_(test_pin_ids)).delete(synchronize_session=False)
                print(f" -> 테스트 핀 {deleted_pins_count}개 및 연관 인증 데이터 삭제 완료")

            deleted_users_count = db.query(User).filter(User.id.in_(test_user_ids)).delete(synchronize_session=False)
            print(f" -> 테스트 사용자 {deleted_users_count}명 삭제 완료")
        else:
            print(" -> 삭제할 테스트 사용자가 없습니다.")

        # 2. 테스트 전용 생성 가짜 명소 (id >= 999900) 삭제
        deleted_test_spots = db.query(TourSpot).filter(TourSpot.id >= 999900).delete(synchronize_session=False)
        if deleted_test_spots > 0:
            print(f" -> 테스트 전용 가짜 명소 {deleted_test_spots}개 삭제 완료")

        # 3. 모든 실제 명소의 전분기점수 및 검색량 초기화
        db.query(TourSpot).update({"previous_quarter_score": 0, "search_count": 0}, synchronize_session=False)

        db.commit()
        print("[SUCCESS] 커뮤니티 테스트 데이터 원복 완료!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 원복 중 오류 발생: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
