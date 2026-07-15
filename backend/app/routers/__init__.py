# Routers 계층 (API 엔드포인트)
# 예:
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.schemas import TourSpotResponse, TourSpotCreate
# from app.services import TourSpotService
# router = APIRouter(prefix="/spots", tags=["spots"])
# @router.post("/", response_model=TourSpotResponse)
# def create_spot(spot: TourSpotCreate, service: TourSpotService = Depends()):
#     return service.register_spot(spot)
