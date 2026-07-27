"""
뱃지 마스터 데이터를 badge_rules.BADGE_DEFINITIONS 기준으로 시딩합니다.

code로 매칭하므로 이름/설명/아이콘을 고쳐도 재실행하면 그대로 갱신됩니다.
"""
import sys
import os

# Add backend directory to sys.path to support direct script execution
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from app.models import Badge
from app.services.badge_rules import BADGE_DEFINITIONS


def main():
    db = SessionLocal()
    created, updated = 0, 0
    try:
        for definition in BADGE_DEFINITIONS:
            badge = db.query(Badge).filter(Badge.code == definition.code).first()

            # code 도입 이전에 이름만으로 만들어진 뱃지가 있으면 이어서 씁니다.
            if not badge:
                badge = db.query(Badge).filter(Badge.name == definition.name).first()

            if badge:
                badge.code = definition.code
                badge.name = definition.name
                badge.description = definition.description
                badge.icon_url = definition.icon
                updated += 1
                continue

            db.add(
                Badge(
                    code=definition.code,
                    name=definition.name,
                    description=definition.description,
                    icon_url=definition.icon,
                )
            )
            created += 1

        db.commit()
        print(f"Badge seeding complete. created={created}, updated={updated}, total={db.query(Badge).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
