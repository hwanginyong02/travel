import sys
import os

# 현재 app 디렉토리 상위 폴더를 path에 추가하여 import 가능하도록 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import User, TourSpot, Pin, PinPhoto, Tag, Verification, ConditionReport, Badge, UserBadge

def init_db():
    print("Database tables creating...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
