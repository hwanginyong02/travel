from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
