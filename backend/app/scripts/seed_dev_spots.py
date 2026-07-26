"""
개발용 임시 명소 시드 스크립트.

관광공사 API 키를 아직 발급받지 못했거나 승인 대기 중일 때,
핀(미시 좌표) 기능을 화면에서 테스트할 수 있도록 명소 몇 곳을 직접 넣습니다.

실제 TourAPI의 contentid와 절대 겹치지 않도록 9,000,000번대 ID를 사용하므로
나중에 sync_places.py로 진짜 데이터를 받아도 충돌하지 않습니다.
--clear 옵션으로 언제든 깨끗하게 지울 수 있습니다.
"""
import sys
import os
import argparse

# Add backend directory to sys.path to support direct script execution
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from app.models import TourSpot

# 실제 TourAPI contentid와 충돌하지 않는 개발 전용 ID 대역
DEV_ID_BASE = 9_000_000

DEV_SPOTS = [
    {
        "title": "[DEV] 설악산국립공원",
        "mapx": 128.4655, "mapy": 38.1191,
        "overview": "개발용 임시 데이터입니다. 강원도 속초시·양양군·인제군에 걸친 국립공원.",
        "cat1": "A01", "cat2": "A0101", "cat3": "A01010100", "contenttypeid": 12,
    },
    {
        "title": "[DEV] 북한산국립공원",
        "mapx": 126.9877, "mapy": 37.6586,
        "overview": "개발용 임시 데이터입니다. 서울과 경기도에 걸친 도심 속 국립공원.",
        "cat1": "A01", "cat2": "A0101", "cat3": "A01010100", "contenttypeid": 12,
    },
    {
        "title": "[DEV] 남산공원",
        "mapx": 126.9882, "mapy": 37.5512,
        "overview": "개발용 임시 데이터입니다. 서울 중구에 위치한 도심 공원.",
        "cat1": "A01", "cat2": "A0101", "cat3": "A01011300", "contenttypeid": 12,
    },
    {
        "title": "[DEV] 한라산국립공원",
        "mapx": 126.5312, "mapy": 33.3617,
        "overview": "개발용 임시 데이터입니다. 제주특별자치도의 국립공원.",
        "cat1": "A01", "cat2": "A0101", "cat3": "A01010100", "contenttypeid": 12,
    },
    {
        "title": "[DEV] 청계산",
        "mapx": 127.0392, "mapy": 37.4126,
        "overview": "개발용 임시 데이터입니다. 서울과 경기 성남·과천에 걸친 산.",
        "cat1": "A01", "cat2": "A0101", "cat3": "A01010400", "contenttypeid": 12,
    },
    {
        "title": "[DEV] 순천만습지",
        "mapx": 127.5093, "mapy": 34.8853,
        "overview": "개발용 임시 데이터입니다. 좌표 블러 처리 확인용 환경 민감 지역 예시.",
        "cat1": "A01", "cat2": "A0101", "cat3": "A01010900", "contenttypeid": 12,
    },
]


def seed(db):
    created, updated = 0, 0
    for offset, data in enumerate(DEV_SPOTS):
        spot_id = DEV_ID_BASE + offset
        spot = db.query(TourSpot).filter(TourSpot.id == spot_id).first()
        if spot:
            for key, value in data.items():
                setattr(spot, key, value)
            updated += 1
        else:
            db.add(TourSpot(id=spot_id, **data))
            created += 1
    db.commit()
    print(f"개발용 명소 시드 완료. created={created}, updated={updated}")
    print(f"ID 범위: {DEV_ID_BASE} ~ {DEV_ID_BASE + len(DEV_SPOTS) - 1}")


def clear(db):
    deleted = (
        db.query(TourSpot)
        .filter(TourSpot.id >= DEV_ID_BASE, TourSpot.id < DEV_ID_BASE + 1_000_000)
        .delete(synchronize_session=False)
    )
    db.commit()
    print(f"개발용 명소 삭제 완료. deleted={deleted}")
    print("주의: 해당 명소에 달려 있던 핀도 CASCADE로 함께 삭제됩니다.")


def main():
    parser = argparse.ArgumentParser(description="개발용 임시 명소를 DB에 넣거나 지웁니다.")
    parser.add_argument("--clear", action="store_true", help="시드한 개발용 명소를 모두 삭제합니다.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        clear(db) if args.clear else seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
