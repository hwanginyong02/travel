from typing import Optional

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


def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    비로그인도 허용하는 엔드포인트용 의존성.
    토큰이 없거나 만료·위조됐을 때 401 대신 None을 돌려주어,
    호출한 쪽이 비로그인 사용자를 위한 대체 응답을 내려줄 수 있게 합니다.
    """
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")
    try:
        return get_current_user(token, db)
    except (ValueError, TypeError):
        # 회원가입용 임시 토큰처럼 sub가 사용자 ID가 아닌 토큰이 들어온 경우
        return None
