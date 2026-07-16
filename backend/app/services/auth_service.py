import os
import logging
import requests
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.models import User

logger = logging.getLogger(__name__)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "travel-app-secret-key-2026-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7


def create_jwt(user_id: int) -> str:
    """자체 JWT 토큰 생성"""
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    """JWT 토큰 디코딩 및 유효성 검증"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user(token: str, db: Session) -> User:
    """JWT에서 user_id를 추출하여 DB에서 User 객체를 반환"""
    payload = decode_jwt(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()


def verify_google_token(access_token: str) -> dict:
    """
    구글 Access Token으로 사용자 프로필을 검증합니다.
    Returns: {"email": ..., "name": ..., "sub": ...} 또는 빈 dict
    """
    try:
        resp = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        if resp.status_code != 200:
            logger.warning(f"Google token verification failed: {resp.status_code}")
            return {}
        data = resp.json()
        return {
            "email": data.get("email"),
            "name": data.get("name", ""),
            "provider_id": data.get("sub"),
        }
    except Exception as e:
        logger.warning(f"Google token verification error: {e}")
        return {}


def verify_kakao_token(access_token: str) -> dict:
    """
    카카오 Access Token으로 사용자 프로필을 검증합니다.
    Returns: {"email": ..., "name": ..., "provider_id": ...} 또는 빈 dict
    """
    try:
        resp = requests.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        if resp.status_code != 200:
            logger.warning(f"Kakao token verification failed: {resp.status_code}")
            return {}
        data = resp.json()
        kakao_account = data.get("kakao_account", {})
        profile = kakao_account.get("profile", {})
        return {
            "email": kakao_account.get("email"),
            "name": profile.get("nickname", ""),
            "provider_id": str(data.get("id")),
        }
    except Exception as e:
        logger.warning(f"Kakao token verification error: {e}")
        return {}


def exchange_kakao_code(code: str, redirect_uri: str) -> str:
    """
    카카오 인가 코드를 REST API 키와 Client Secret을 사용하여 Access Token으로 교환합니다.
    """
    client_id = os.getenv("NEXT_PUBLIC_KAKAO_REST_API_KEY", "")
    client_secret = os.getenv("KAKAO_CLIENT_SECRET", "")
    
    if not client_id:
        logger.error("NEXT_PUBLIC_KAKAO_REST_API_KEY is not set in backend env.")
        return None

    params = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "code": code,
    }
    if client_secret:
        params["client_secret"] = client_secret

    try:
        resp = requests.post(
            "https://kauth.kakao.com/oauth/token",
            data=params,
            headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
            timeout=10
        )
        if resp.status_code != 200:
            logger.warning(f"Kakao token exchange failed: {resp.status_code} - {resp.text}")
            return None
        data = resp.json()
        return data.get("access_token")
    except Exception as e:
        logger.warning(f"Kakao token exchange error: {e}")
        return None

