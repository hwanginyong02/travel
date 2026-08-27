import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
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

class CatchAllMiddleware(BaseHTTPMiddleware):
    """
    처리되지 않은 예외를 500 응답으로 바꿉니다.

    @app.exception_handler(Exception) 대신 미들웨어로 둔 이유:
    Starlette는 그 데코레이터를 ServerErrorMiddleware(가장 바깥)에 설치하는데,
    거기서 만든 응답은 CORSMiddleware를 거치지 않아 CORS 헤더가 빠집니다.
    그러면 브라우저에는 500이 아니라 "No 'Access-Control-Allow-Origin' header"
    라는 엉뚱한 CORS 에러로 보여 원인 파악이 어려워집니다.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            print(f"[ERROR] Uncaught Exception on {request.method} {request.url.path}: {exc}")
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"detail": f"Server Error: {str(exc)}"},
            )


# 미들웨어는 나중에 등록한 것이 바깥쪽입니다.
# CORS가 CatchAll보다 바깥에 있어야 500 응답에도 CORS 헤더가 붙으므로,
# 아래 두 add_middleware 호출의 순서를 바꾸지 마세요.
app.add_middleware(CatchAllMiddleware)

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
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        # DB가 끊겨 있으면 200을 주지 않습니다.
        # 200을 주면 CD의 헬스체크가 통과해 "배포 성공"으로 보이지만,
        # 실제로는 로그인 등 DB를 쓰는 모든 기능이 죽어 있는 상태가 됩니다.
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "version": "0.1.0", "db": f"error: {e}"},
        )
    return {"status": "ok", "version": "0.1.0", "db": "connected"}


