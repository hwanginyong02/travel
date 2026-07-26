from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.repositories import PinRepository, VerificationRepository
from app.routers.deps import get_authenticated_user
from app.schemas import VerificationCreateResponse, VerificationResponse
from app.services import VerificationService
from app.services.storage_service import ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES
from app.services.verification_service import VerificationError

router = APIRouter(prefix="/api/verifications", tags=["verifications"])

# 서비스 계층의 규칙 위반 코드를 HTTP 상태 코드로 옮깁니다.
ERROR_STATUS = {
    "self_verification": 400,
    "already_verified": 409,
}


@router.post("", response_model=VerificationCreateResponse, status_code=201)
async def create_verification(
    pin_id: int = Form(...),
    is_still_there: bool = Form(...),
    photo: Optional[UploadFile] = File(None),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    핀을 직접 방문하고 '지금도 그대로인가요?'에 답합니다.
    현장 사진은 선택이며, 첨부하면 EXIF로 방문을 검증해 신뢰도를 더 크게 올립니다.
    """
    pin = PinRepository().get_by_id(db, pin_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")

    image_bytes = None
    if photo is not None and photo.filename:
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다.")

        image_bytes = await photo.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="사진 파일이 비어 있습니다.")
        if len(image_bytes) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=413, detail="사진 용량은 10MB 이하만 등록할 수 있습니다.")

    try:
        verification, reliability_score, photo_validated, message = VerificationService().create_verification(
            db,
            user_id=user.id,
            pin=pin,
            is_still_there=is_still_there,
            image_bytes=image_bytes,
            image_filename=photo.filename if photo else None,
        )
    except VerificationError as e:
        raise HTTPException(status_code=ERROR_STATUS.get(e.code, 400), detail=e.message)

    return VerificationCreateResponse(
        verification=VerificationResponse.model_validate(verification),
        reliability_score=reliability_score,
        photo_validated=photo_validated,
        message=message,
    )


@router.get("", response_model=List[VerificationResponse])
def get_verifications(
    pin_id: int = Query(..., description="인증 기록을 조회할 핀 ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """한 핀에 쌓인 방문 인증 기록을 최신순으로 조회합니다."""
    return VerificationRepository().get_by_pin(db, pin_id, skip=skip, limit=limit)
