# Services 계층 (비즈니스 로직)
# 예:
# from sqlalchemy.orm import Session
# from app.repositories import TourSpotRepository
# class TourSpotService:
#     def __init__(self):
#         self.repo = TourSpotRepository()
#     def register_spot(self, db: Session, spot_data):
#         # 비즈니스 로직 수행 (EXIF 추출, TourAPI 연동 등)
#         return self.repo.create(db, spot_data)
