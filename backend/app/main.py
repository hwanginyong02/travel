from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import admin_router, spots_router, auth_router

app = FastAPI(
    title="2026 관광데이터 활용 공모전 API",
    description="관광데이터 활용 공모전 백엔드 서비스",
    version="0.1.0"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)
app.include_router(spots_router)
app.include_router(auth_router)



@app.get("/")
def read_root():
    return {"message": "Welcome to 2026 Tourist Data API"}


