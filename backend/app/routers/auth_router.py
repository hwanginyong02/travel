from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas.auth import (
    SocialLoginRequest,
    RegisterRequest,
    TokenResponse,
    NicknameCheckResponse,
    UserProfileResponse,
)
from app.services.auth_service import (
    verify_google_token,
    verify_kakao_token,
    exchange_kakao_code,
    create_jwt,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/social", response_model=TokenResponse)
def social_login(req: SocialLoginRequest, db: Session = Depends(get_db)):
    """
    소셜 토큰 검증 → 기존 회원이면 JWT 발급, 신규 회원이면 is_new=True 반환.
    """
    # 1. 소셜 토큰 획득 또는 검증
    access_token = req.access_token
    if req.provider == "kakao" and req.code:
        if not req.redirect_uri:
            raise HTTPException(status_code=400, detail="redirect_uri is required for code exchange")
        access_token = exchange_kakao_code(req.code, req.redirect_uri)
        if not access_token:
            raise HTTPException(status_code=401, detail="Failed to exchange authorization code for access token")

    if req.provider == "google":
        if not access_token:
            raise HTTPException(status_code=400, detail="access_token is required for Google login")
        profile = verify_google_token(access_token)
    elif req.provider == "kakao":
        if not access_token:
            raise HTTPException(status_code=400, detail="access_token or code is required for Kakao login")
        profile = verify_kakao_token(access_token)
    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    if not profile or not profile.get("provider_id"):
        raise HTTPException(status_code=401, detail="Invalid social token or profile verification failed")


    provider_id = profile["provider_id"]
    social_nickname = profile.get("name", "")

    # 2. 기존 회원 확인 (provider + provider_id로 매칭)
    existing_user = db.query(User).filter(
        User.provider == req.provider,
        User.provider_id == provider_id
    ).first()

    if existing_user:
        # 기존 회원 → JWT 발급
        token = create_jwt(existing_user.id)
        return TokenResponse(
            access_token=token,
            is_new=False,
            social_nickname=social_nickname
        )
    else:
        # 신규 회원 → 임시 토큰 발급 (회원가입 페이지로 유도)
        # provider_id를 임시 토큰에 담아서 register 단계에서 사용
        from jose import jwt as jose_jwt
        import os
        temp_payload = {
            "provider": req.provider,
            "provider_id": provider_id,
            "email": profile.get("email"),
            "temp": True
        }
        secret = os.getenv("JWT_SECRET_KEY", "travel-app-secret-key-2026-change-in-production")
        temp_token = jose_jwt.encode(temp_payload, secret, algorithm="HS256")
        return TokenResponse(
            access_token=temp_token,
            is_new=True,
            social_nickname=social_nickname
        )


@router.post("/register", response_model=TokenResponse)
def register(
    req: RegisterRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    회원가입: 임시 토큰에서 소셜 정보 추출 → 닉네임 중복 확인 → User 생성 → JWT 발급.
    """
    # 1. 임시 토큰 디코딩
    token = authorization.replace("Bearer ", "")
    from jose import jwt as jose_jwt, JWTError
    import os
    secret = os.getenv("JWT_SECRET_KEY", "travel-app-secret-key-2026-change-in-production")
    try:
        payload = jose_jwt.decode(token, secret, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not payload.get("temp"):
        raise HTTPException(status_code=400, detail="Not a registration token")

    # 2. 닉네임 중복 확인
    if db.query(User).filter(User.nickname == req.nickname).first():
        raise HTTPException(status_code=409, detail="이미 사용 중인 닉네임입니다.")

    # 3. 성별에 따른 기본 프로필 이미지 설정
    profile_image = "/icon/male.png" if req.gender == "male" else "/icon/female.png"

    # 4. User 생성
    new_user = User(
        email=payload.get("email"),
        nickname=req.nickname,
        provider=payload.get("provider"),
        provider_id=payload.get("provider_id"),
        gender=req.gender,
        age_group=req.age_group,
        profile_image=profile_image,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. 정식 JWT 발급
    token = create_jwt(new_user.id)
    return TokenResponse(access_token=token, is_new=False)


@router.get("/check-nickname", response_model=NicknameCheckResponse)
def check_nickname(nickname: str, db: Session = Depends(get_db)):
    """닉네임 중복 여부 확인"""
    exists = db.query(User).filter(User.nickname == nickname).first()
    if exists:
        return NicknameCheckResponse(available=False, message="이미 사용 중인 닉네임입니다.")
    return NicknameCheckResponse(available=True, message="사용 가능한 닉네임입니다.")


@router.get("/me", response_model=UserProfileResponse)
def get_me(authorization: str = Header(...), db: Session = Depends(get_db)):
    """현재 로그인한 사용자의 프로필 반환"""
    token = authorization.replace("Bearer ", "")
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.delete("/withdraw")
def withdraw(authorization: str = Header(...), db: Session = Depends(get_db)):
    """회원 탈퇴 처리 (사용자 계정 삭제)"""
    token = authorization.replace("Bearer ", "")
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db.delete(user)
    db.commit()
    return {"message": "Membership withdrawn successfully"}

