"""
기존 테이블에 새로 추가된 컬럼을 안전하게 반영합니다.

Base.metadata.create_all()은 없는 테이블만 만들 뿐 기존 테이블에 컬럼을 추가하지 않습니다.
Alembic을 도입하기 전까지 쓰는 임시 방편이며, 이미 반영된 컬럼은 건너뛰므로
여러 번 실행해도 안전합니다.
"""
import sys
import os

# Add backend directory to sys.path to support direct script execution
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from sqlalchemy import inspect, text

from app.database import engine

# (테이블명, 컬럼명, 컬럼 정의)
MIGRATIONS = [
    ("verifications", "is_validated", "BOOLEAN NOT NULL DEFAULT FALSE"),
]


def main():
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    applied, skipped = 0, 0

    with engine.begin() as conn:
        for table, column, definition in MIGRATIONS:
            if table not in existing_tables:
                print(f"  건너뜀: {table} 테이블이 없습니다. init_db.py를 먼저 실행하세요.")
                skipped += 1
                continue

            columns = {c["name"] for c in inspector.get_columns(table)}
            if column in columns:
                print(f"  건너뜀: {table}.{column} 이미 존재")
                skipped += 1
                continue

            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
            print(f"  추가: {table}.{column} {definition}")
            applied += 1

    print(f"스키마 반영 완료. applied={applied}, skipped={skipped}")


if __name__ == "__main__":
    main()
