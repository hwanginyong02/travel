import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# .env 파일 로드
load_dotenv()

# 환경 변수로부터 PostgreSQL 연결 URL을 가져옴 (기본값 설정)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/travel_db")

# PostgreSQL 연결 엔진 설정 (psycopg2-binary 패키지 필요)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# DB 세션 의존성 주입을 위한 Helper 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
