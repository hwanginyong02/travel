import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.repositories import PinRepository, TourSpotRepository
from app.routers.deps import get_authenticated_user
from app.schemas import (
    PhotoExifPreviewResponse,
    PinCreateRequest,
    PinCreateResponse,
    PinResponse,
    RewardResponse,
)
from app.services import PinService
from app.services.pin_service import ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES, PinError

router = APIRouter(prefix="/api/pins", tags=["pins"])

# 서비스 계층의 규칙 위반 코드를 HTTP 상태 코드로 옮깁니다.
ERROR_STATUS = {
    "no_gps": 400,
    "spot_mismatch": 400,
}


async def _read_photo(photo: UploadFile) -> bytes:
    """업로드된 사진을 형식·용량 검사와 함께 읽어옵니다."""
    if photo.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다.")

    image_bytes = await photo.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="사진 파일이 비어 있습니다.")
    if len(image_bytes) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=413, detail="사진 용량은 10MB 이하만 등록할 수 있습니다.")
    return image_bytes


def _parse_tags(raw: Optional[str]) -> List[str]:
    """multipart로 들어온 tags를 리스트로 변환합니다. JSON 배열과 콤마 구분 문자열을 모두 허용합니다."""
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except (json.JSONDecodeError, TypeError):
        pass
    return [part for part in raw.split(",") if part.strip()]


@router.post("", response_model=PinCreateResponse, status_code=201)
async def create_pin(
    tour_spot_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    tags: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    숨은 좌표 핀을 등록합니다.
    핀 좌표는 사진의 EXIF에서 읽으므로 위치 정보가 있는 원본 사진 1장이 필수입니다.
    """
    image_bytes = await _read_photo(photo)

    # 모든 값 검증은 Schemas 계층에서 1회만 수행합니다.
    # 직접 생성한 모델의 ValidationError는 FastAPI가 자동 변환하지 않으므로,
    # 다른 엔드포인트와 동일한 422 응답 형태가 되도록 여기서 넘겨줍니다.
    try:
        payload = PinCreateRequest(
            tour_spot_id=tour_spot_id,
            title=title,
            description=description,
            tags=_parse_tags(tags),
        )
    except ValidationError as e:
        raise RequestValidationError(e.errors())

    tour_spot = TourSpotRepository().get_by_id(db, payload.tour_spot_id)
    if not tour_spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    try:
        result = PinService().create_pin(
            db,
            user=user,
            tour_spot=tour_spot,
            title=payload.title,
            description=payload.description,
            tag_names=payload.tags,
            image_bytes=image_bytes,
            image_filename=photo.filename,
        )
    except PinError as e:
        raise HTTPException(status_code=ERROR_STATUS.get(e.code, 400), detail=e.message)

    return PinCreateResponse(
        pin=PinResponse.model_validate(result.pin),
        exif_validated=result.exif_validated,
        validation_message=result.message,
        reward=RewardResponse.from_reward(result.reward),
        photo_taken_at=result.photo_taken_at,
        is_photo_recent=result.is_photo_recent,
    )


@router.post("/preview-exif", response_model=PhotoExifPreviewResponse)
async def preview_photo_exif(
    tour_spot_id: int = Form(...),
    photo: UploadFile = File(...),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    등록 전에 사진의 EXIF를 미리 확인합니다.
    사진을 고른 즉시 등록 가능 여부와 촬영 위치를 알려주기 위한 용도입니다.
    """
    image_bytes = await _read_photo(photo)

    tour_spot = TourSpotRepository().get_by_id(db, tour_spot_id)
    if not tour_spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    service = PinService()
    exif_result = service.inspect_photo(image_bytes, tour_spot)

    try:
        service.ensure_registrable(exif_result, tour_spot)
        can_register, message = True, exif_result.message
    except PinError as e:
        can_register, message = False, e.message

    return PhotoExifPreviewResponse(
        can_register=can_register,
        has_gps=exif_result.has_gps,
        is_recent=exif_result.is_recent,
        latitude=exif_result.latitude,
        longitude=exif_result.longitude,
        taken_at=exif_result.taken_at,
        age_days=int(exif_result.age_days) if exif_result.age_days is not None else None,
        distance_m=int(exif_result.distance_m) if exif_result.distance_m is not None else None,
        message=message,
    )


@router.get("", response_model=List[PinResponse])
def get_pins(
    tour_spot_id: int = Query(..., description="핀을 조회할 명소 ID"),
    sort: str = Query("popular", pattern="^(popular|latest)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """한 명소에 등록된 핀 목록을 조회합니다."""
    return PinRepository().get_by_spot(db, tour_spot_id, sort=sort, skip=skip, limit=limit)


@router.get("/me", response_model=List[PinResponse])
def get_my_pins(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """내가 등록한 핀 목록을 최신순으로 조회합니다."""
    return PinRepository().get_by_user(db, user.id, skip=skip, limit=limit)


# '/me'는 '/{pin_id}'보다 반드시 위에 있어야 합니다. 아래에 두면 'me'가 int 변환에 걸려 422가 납니다.
@router.get("/{pin_id}", response_model=PinResponse)
def get_pin(pin_id: int, db: Session = Depends(get_db)):
    """핀 상세를 조회합니다."""
    pin = PinRepository().get_by_id(db, pin_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    return pin
