from fastapi import FastAPI

app = FastAPI(
    title="2026 관광데이터 활용 공모전 API",
    description="관광데이터 활용 공모전 백엔드 서비스",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to 2026 Tourist Data API"}
