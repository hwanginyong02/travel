import sys
import os
import argparse

# Add backend directory to sys.path to support direct script execution
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal
from app.services import TourApiService


def main():
    parser = argparse.ArgumentParser(description="Synchronize TourAPI Nature (A01) spots into DB.")
    parser.add_argument("--limit", type=int, default=None, help="Limit the number of spots to synchronize (for testing).")
    args = parser.parse_args()

    print("Starting TourAPI Nature (A01) synchronization...")
    db = SessionLocal()
    try:
        service = TourApiService()
        result = service.sync_nature_spots(db, limit=args.limit)
        print(f"Synchronization complete: {result}")
    except Exception as e:
        print(f"Error during synchronization: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
