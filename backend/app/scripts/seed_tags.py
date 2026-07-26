import sys
import os

# Add backend directory to sys.path to support direct script execution
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from app.models import Tag
from app.services.pin_service import DANGER_KEYWORD_TAGS

# 제안서의 경험 태그 예시를 기본 추천 태그로 제공합니다.
EXPERIENCE_TAGS = [
    "물멍벤치",
    "피톤치드",
    "인생샷포인트",
    "조용한곳",
    "산스장",
    "일출명소",
    "야경명소",
    "돗자리스팟",
]


def main():
    db = SessionLocal()
    created = 0
    try:
        seeds = [(name, False) for name in EXPERIENCE_TAGS]
        seeds += [(name, True) for name in sorted(set(DANGER_KEYWORD_TAGS.values()))]

        for name, is_danger in seeds:
            tag = db.query(Tag).filter(Tag.name == name).first()
            if tag:
                # 기존 태그의 위험 여부만 최신 정책에 맞게 갱신
                if tag.is_danger != is_danger:
                    tag.is_danger = is_danger
                continue
            db.add(Tag(name=name, is_danger=is_danger))
            created += 1

        db.commit()
        print(f"Tag seeding complete. created={created}, total={db.query(Tag).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
