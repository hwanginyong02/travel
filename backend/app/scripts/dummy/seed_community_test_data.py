"""
DB 내 실제 한국관광공사 TourAPI 명소(TourSpot) 데이터를 기반으로 한
커뮤니티 데이터 주입 스크립트.

특징:
1. app/scripts/dummy/ 디렉토리에 위치
2. 1위 명소(삼악산) 주변에 다수의 핀이 다양한 위경도 방위(북서, 북동, 남서 등)로 찍혀 분포되도록 연출
3. 각 핀의 인증 사진첩(Verification Photos) 채우기
4. 마스터 뱃지 자동 시딩

실행 방법:
python app/scripts/dummy/seed_community_test_data.py
"""
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, TourSpot, Pin, PinPhoto, Verification, Badge
from app.repositories import PinRepository
from app.services.verification_service import calculate_reliability
from app.scripts.seed_badges import main as seed_badges_main

TEST_USER_PREFIX = "[TEST_SEED]"

# 시드용 다양한 현장 사진 리스트 (Unsplash)
VERIFICATION_PHOTO_POOL = [
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=600&q=80",
]

def main():
    db: Session = SessionLocal()
    try:
        print("[1/5] 마스터 뱃지 데이터 시딩 확인...")
        seed_badges_main()

        print("[2/5] 실제 관광 명소(TourSpot) 기반 커뮤니티 데이터 주입 시작...")

        # 1. 테스트 사용자 생성
        user_data_list = [
            {"nickname": f"{TEST_USER_PREFIX} 힐링매니아", "email": "seed_healing@travel.com", "level": 4, "points": 1200},
            {"nickname": f"{TEST_USER_PREFIX} 야경꾼", "email": "seed_night@travel.com", "level": 3, "points": 850},
            {"nickname": f"{TEST_USER_PREFIX} 숲길탐험가", "email": "seed_forest@travel.com", "level": 5, "points": 2100},
            {"nickname": f"{TEST_USER_PREFIX} 산악왕", "email": "seed_mountain@travel.com", "level": 2, "points": 450},
            {"nickname": f"{TEST_USER_PREFIX} 쉼표마스터", "email": "seed_master@travel.com", "level": 6, "points": 3500},
        ]
        test_users = []
        for uinfo in user_data_list:
            user = db.query(User).filter(User.nickname == uinfo["nickname"]).first()
            if not user:
                user = User(
                    nickname=uinfo["nickname"],
                    email=uinfo["email"],
                    profile_image="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
                    level=uinfo["level"],
                    points=uinfo["points"]
                )
                db.add(user)
                db.flush()
            test_users.append(user)

        print(f" -> 테스트 사용자 {len(test_users)}명 준비 완료")

        # 2. DB에 존재하는 실제 관광공사 명소(TourSpot) 3개 확보
        real_spots = db.query(TourSpot).filter(TourSpot.id < 900000).limit(3).all()
        if len(real_spots) < 3:
            raise RuntimeError("DB에 실제 TourSpot 데이터가 3개 이상 필요합니다.")

        metrics = [
            {"prev_score": 120, "search": 80},
            {"prev_score": 50, "search": 30},
            {"prev_score": 20, "search": 10},
        ]

        for idx, spot in enumerate(real_spots):
            m = metrics[idx % len(metrics)]
            spot.previous_quarter_score = m["prev_score"]
            spot.search_count = m["search"]
            print(f" -> 실제 명소 [ID: {spot.id} / {spot.title}]: 전분기점수={m['prev_score']}, 검색량={m['search']}")

        db.flush()

        # 3. 명소 주변에 다양하고 넓게 찍히는 쉼표(핀) 데이터 주입
        # 위경도 방위 오프셋 (북서, 북동, 남서 등 약 200m~500m 다양하게 분산)
        offsets = [
            (0.0035, -0.0028),  # 북서쪽
            (0.0042, 0.0031),   # 북동쪽
            (-0.0031, -0.0019), # 남서쪽
            (0.0025, 0.0040),   # 동쪽
            (-0.0038, 0.0027),  # 남동쪽
        ]

        repo = PinRepository()
        pin_specs = [
            # 1위 명소 (삼악산) - 핀 #1 (북서쪽 쉼터 / 인증 15개)
            {
                "spot": real_spots[0],
                "title": f"{real_spots[0].title} 의암호 조망 북서쪽 쉼터",
                "desc": f"{real_spots[0].title} 북서쪽 능선 산책로에 위치한 비밀 쉼터입니다. 탁 트인 호수 전경이 일품입니다.",
                "tag": "자연명소",
                "target_verifications": 15,
                "photo": VERIFICATION_PHOTO_POOL[0],
                "lat_off": offsets[0][0], "lng_off": offsets[0][1]
            },
            # 1위 명소 (삼악산) - 핀 #2 (북동쪽 쉼터 / 인증 10개)
            {
                "spot": real_spots[0],
                "title": f"{real_spots[0].title} 북동쪽 소나무 피톤치드 쉼터",
                "desc": f"{real_spots[0].title} 북동쪽 소나무 숲길에 위치한 공기 맑은 피톤치드 쉼터입니다.",
                "tag": "피톤치드",
                "target_verifications": 10,
                "photo": VERIFICATION_PHOTO_POOL[1],
                "lat_off": offsets[1][0], "lng_off": offsets[1][1]
            },
            # 1위 명소 (삼악산) - 핀 #3 (남서쪽 계곡 / 인증 5개)
            {
                "spot": real_spots[0],
                "title": f"{real_spots[0].title} 남서쪽 계곡 바위 쉼터",
                "desc": f"{real_spots[0].title} 남서쪽 시원한 계곡물이 흐르는 그늘 바위 쉼터입니다.",
                "tag": "산스장",
                "target_verifications": 5,
                "photo": VERIFICATION_PHOTO_POOL[2],
                "lat_off": offsets[2][0], "lng_off": offsets[2][1]
            },
            # 2위 명소 (대둔산) - 핀 #4 (동쪽 능선 / 인증 8개)
            {
                "spot": real_spots[1],
                "title": f"{real_spots[1].title} 동쪽 능선 노을 쉼터",
                "desc": f"{real_spots[1].title} 동쪽 능선을 따라가면 만나는 멋진 일몰 쉼터입니다.",
                "tag": "노을맛집",
                "target_verifications": 8,
                "photo": VERIFICATION_PHOTO_POOL[3],
                "lat_off": offsets[3][0], "lng_off": offsets[3][1]
            },
            # 3위 명소 (지리산) - 핀 #5 (남동쪽 구름다리 / 인증 3개)
            {
                "spot": real_spots[2],
                "title": f"{real_spots[2].title} 남동쪽 정자 쉼터",
                "desc": f"{real_spots[2].title} 남동쪽 산책로 정자 옆 탁 트인 조망 쉼터입니다.",
                "tag": "인생샷포인트",
                "target_verifications": 3,
                "photo": VERIFICATION_PHOTO_POOL[4],
                "lat_off": offsets[4][0], "lng_off": offsets[4][1]
            }
        ]

        seeded_pins = []
        for idx, spec in enumerate(pin_specs):
            spot = spec["spot"]
            author = test_users[idx % len(test_users)]
            
            existing_pin = db.query(Pin).filter(Pin.title == spec["title"]).first()
            if not existing_pin:
                tags = repo.get_or_create_tags(db, [spec["tag"]])
                pin = repo.create(
                    db,
                    {
                        "tour_spot_id": spot.id,
                        "user_id": author.id,
                        "title": spec["title"],
                        "description": spec["desc"],
                        "latitude": spot.mapy + spec["lat_off"],
                        "longitude": spot.mapx + spec["lng_off"],
                        "reliability_score": 100,
                    },
                    tags=tags,
                )
                repo.add_photo(
                    db,
                    {
                        "pin_id": pin.id,
                        "photo_url": spec["photo"],
                        "is_validated": True,
                    },
                )
                seeded_pins.append((pin, spec["target_verifications"]))
            else:
                seeded_pins.append((existing_pin, spec["target_verifications"]))

        # 4. 실시간 방문 인증 및 사진첩 채우기
        for pin, target_v_cnt in seeded_pins:
            current_v_cnt = db.query(Verification).filter(Verification.pin_id == pin.id).count()
            needed = target_v_cnt - current_v_cnt

            for i in range(needed):
                v_user = test_users[i % len(test_users)]
                v_photo = VERIFICATION_PHOTO_POOL[(i + pin.id) % len(VERIFICATION_PHOTO_POOL)] if i % 2 == 0 else None
                
                verification = Verification(
                    pin_id=pin.id,
                    user_id=v_user.id,
                    is_still_there=True,
                    is_validated=True,
                    photo_url=v_photo
                )
                db.add(verification)

            db.flush()
            db.refresh(pin)
            pin.reliability_score = calculate_reliability(pin)
            
            photo_cnt = db.query(Verification).filter(Verification.pin_id == pin.id, Verification.photo_url.isnot(None)).count()
            print(f" -> 핀 [{pin.title}] (ID: {pin.id}): 좌표 ({pin.latitude:.4f}, {pin.longitude:.4f}), 인증 {target_v_cnt}개 (인증사진 {photo_cnt}개)")

        db.commit()
        print("[SUCCESS] app/scripts/dummy/ 스크립트 기반 다양화 데이터 주입 완료!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] 주입 중 오류 발생: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
