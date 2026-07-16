from sqlalchemy.orm import Session
from app.models import TourSpot

class TourSpotRepository:
    def get_by_id(self, db: Session, spot_id: int):
        return db.query(TourSpot).filter(TourSpot.id == spot_id).first()

    def search_spots(self, db: Session, query: str = None, skip: int = 0, limit: int = 50):
        q = db.query(TourSpot)
        if query:
            q = q.filter(TourSpot.title.ilike(f"%{query}%"))
        return q.offset(skip).limit(limit).all()

    def get_random_spots(self, db: Session, limit: int = 5):
        from sqlalchemy.sql.expression import func
        return db.query(TourSpot).order_by(func.random()).limit(limit).all()

    def get_spots_by_cat3(self, db: Session, cat3: str, limit: int = 50):
        return db.query(TourSpot).filter(TourSpot.cat3 == cat3).limit(limit).all()

    def get_spots_with_bounds(
        self,
        db: Session,
        min_lat: float = None,
        max_lat: float = None,
        min_lng: float = None,
        max_lng: float = None,
        cat3: str = None,
        limit: int = 1000
    ):
        q = db.query(TourSpot)
        
        # Bounding box filters (mapy = latitude, mapx = longitude)
        if min_lat is not None:
            q = q.filter(TourSpot.mapy >= min_lat)
        if max_lat is not None:
            q = q.filter(TourSpot.mapy <= max_lat)
        if min_lng is not None:
            q = q.filter(TourSpot.mapx >= min_lng)
        if max_lng is not None:
            q = q.filter(TourSpot.mapx <= max_lng)
            
        if cat3:
            q = q.filter(TourSpot.cat3 == cat3)
            
        return q.limit(limit).all()




    def upsert_spot(self, db: Session, spot_data: dict) -> TourSpot:
        spot_id = spot_data.get("id")
        db_spot = self.get_by_id(db, spot_id)
        if db_spot:
            # Update fields
            for key, value in spot_data.items():
                if hasattr(db_spot, key):
                    setattr(db_spot, key, value)
        else:
            db_spot = TourSpot(**spot_data)
            db.add(db_spot)
        
        db.commit()
        db.refresh(db_spot)
        return db_spot
