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
    parser = argparse.ArgumentParser(description="Synchronize TourAPI Nature (A01) and Park spots into DB.")
    parser.add_argument("--limit", type=int, default=None, help="Limit the number of spots to synchronize (for testing).")
    parser.add_argument(
        "--category",
        choices=["nature", "parks", "all"],
        default="all",
        help="Select category to sync: 'nature' (A01 nature spots), 'parks' (general & security parks), or 'all'."
    )
    args = parser.parse_args()

    categories = None
    if args.category == "nature":
        categories = ["nature"]
    elif args.category == "parks":
        categories = ["general_parks", "security_parks"]

    print(f"Starting TourAPI synchronization (Category: {args.category})...")
    db = SessionLocal()
    try:
        service = TourApiService()
        result = service.sync_nature_spots(db, limit=args.limit, categories=categories)
        print(f"Synchronization complete: {result}")
    except Exception as e:
        print(f"Error during synchronization: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
