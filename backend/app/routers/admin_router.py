from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import TourApiService

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/sync/nature")
def sync_nature_spots(
    limit: int = Query(None, description="Max number of spots to synchronize (for testing)"),
    db: Session = Depends(get_db)
):
    service = TourApiService()
    result = service.sync_nature_spots(db, limit=limit)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result
