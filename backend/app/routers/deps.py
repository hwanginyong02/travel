from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.auth_service import get_current_user


def get_authenticated_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    """Authorization 헤더의 JWT를 검증해 로그인한 User를 반환하는 공통 의존성."""
    token = authorization.replace("Bearer ", "")
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
