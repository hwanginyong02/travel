from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

from app.routers import (
    admin_router,
    spots_router,
    auth_router,
    pins_router,
    verifications_router,
    gamification_router,
    community_router,
)
from app.services.pin_service import PIN_PHOTO_DIR, PUBLIC_UPLOAD_PREFIX, UPLOAD_ROOT
from app.scripts.migrate_schema import main as run_migrations
from app.scripts.seed_tags import main as seed_tags
from app.scripts.seed_badges import main as seed_badges


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 DB 스키마 검증/생성 및 초기 데이터 시딩 자동 실행
    try:
        run_migrations()
        seed_tags()
        seed_badges()
    except Exception as e:
        print(f"DB Startup Initialization Warning: {e}")
    yield


app = FastAPI(
    title="2026 관광데이터 활용 공모전 API",
    description="관광데이터 활용 공모전 백엔드 서비스",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # 로컬 개발 환경
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # 프로덕션 도메인 (Cloudflare)
        "https://travelmap.win",
        "https://www.travelmap.win",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] Uncaught Exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"},
    )


# 사용자가 등록한 핀 사진을 정적 파일로 서빙합니다.
PIN_PHOTO_DIR.mkdir(parents=True, exist_ok=True)
app.mount(PUBLIC_UPLOAD_PREFIX, StaticFiles(directory=UPLOAD_ROOT), name="uploads")

app.include_router(admin_router)
app.include_router(spots_router)
app.include_router(auth_router)
app.include_router(pins_router)
app.include_router(verifications_router)
app.include_router(gamification_router)
app.include_router(community_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to 2026 Tourist Data API"}


@app.get("/healthz")
def healthcheck(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {e}"
    return {"status": "ok", "version": "0.1.0", "db": db_status}


