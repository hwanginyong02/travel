import os
import sys
import time
from dotenv import load_dotenv

# Ensure the parent directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

load_dotenv()

from app.database import SessionLocal
from app.models import TourSpot
from app.services.tour_api_service import TourApiService

def main():
    db = SessionLocal()
    print("Reading spots from database...")
    all_spots = db.query(TourSpot).all()
    
    # Filter in Python to avoid JSON comparison syntax differences across databases
    spots_to_update = []
    for spot in all_spots:
        is_empty_overview = not spot.overview or not spot.overview.strip()
        is_empty_intro = not spot.intro_info or spot.intro_info == {}
        
        if is_empty_overview or is_empty_intro:
            spots_to_update.append((spot, is_empty_overview, is_empty_intro))
            
    total = len(spots_to_update)
    print(f"Found {total} spots needing details update.")
    
    if total == 0:
        print("All spots are already fully populated!")
        return
        
    service = TourApiService()
    
    try:
        for idx, (spot, update_overview, update_intro) in enumerate(spots_to_update, 1):
            actions = []
            if update_overview:
                actions.append("overview")
            if update_intro:
                actions.append("intro_info")
                
            print(f"[{idx}/{total}] Updating {spot.title} (ID: {spot.id}) - Fields: {', '.join(actions)}")
            
            if update_overview:
                overview = service.fetch_spot_overview(spot.id)
                if overview:
                    spot.overview = overview
                time.sleep(0.2)
                
            if update_intro:
                intro = service.fetch_spot_intro(spot.id, spot.contenttypeid or 12)
                if intro:
                    spot.intro_info = intro
                time.sleep(0.2)
                
            # Commit every 10 updates to save progress
            if idx % 10 == 0:
                db.commit()
                print("--- Progress committed to database ---")
                
    except KeyboardInterrupt:
        print("\nSync paused by user. Saving progress...")
    finally:
        db.commit()
        db.close()
        print("Sync complete!")

if __name__ == "__main__":
    main()
