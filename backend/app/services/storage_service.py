import os
import uuid
from pathlib import Path

UPLOAD_ROOT = Path(os.getenv("UPLOAD_DIR", "uploads"))
PUBLIC_UPLOAD_PREFIX = "/uploads"

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"}
MAX_PHOTO_BYTES = 10 * 1024 * 1024  # 10MB


def save_image(image_bytes: bytes, filename: str, subdir: str) -> str:
    """
    이미지를 uploads/{subdir}/ 아래에 저장하고 공개 URL 경로를 반환합니다.
    핀 등록 사진과 방문 인증 사진이 이 함수를 공유합니다.
    """
    target_dir = UPLOAD_ROOT / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(filename or "").suffix.lower() or ".jpg"
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    (target_dir / stored_name).write_bytes(image_bytes)

    return f"{PUBLIC_UPLOAD_PREFIX}/{subdir}/{stored_name}"
