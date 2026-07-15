# Schemas 계층 (데이터 검증 및 직렬화 - Pydantic)
# 예:
# from pydantic import BaseModel
# class TourSpotBase(BaseModel):
#     title: str
# class TourSpotCreate(TourSpotBase):
#     pass
# class TourSpotResponse(TourSpotBase):
#     id: int
#     class Config:
#         from_attributes = True
