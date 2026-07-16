import os
import requests
import logging
from sqlalchemy.orm import Session
from app.repositories import TourSpotRepository

logger = logging.getLogger(__name__)

class TourApiService:
    def __init__(self):
        self.repo = TourSpotRepository()
        self.api_key = os.getenv("TOUR_API_KEY", "")
        self.base_url = os.getenv("TOUR_API_BASE_URL", "http://apis.data.go.kr/B551011/KorService1")
        
        # Determine endpoints based on API version (KorService1 or KorService2)
        if "KorService2" in self.base_url:
            self.area_list_url = f"{self.base_url}/areaBasedList2"
            self.detail_common_url = f"{self.base_url}/detailCommon2"
        else:
            self.area_list_url = f"{self.base_url}/areaBasedList1"
            self.detail_common_url = f"{self.base_url}/detailCommon1"

    def fetch_nature_spots(self, page_no: int = 1, num_of_rows: int = 50) -> tuple[list, int]:
        """
        Fetches tourist spots from TourAPI with cat1=A01 (Nature).
        Returns a tuple of (list of spots, total count).
        """
        if not self.api_key or self.api_key == "YOUR_TOUR_API_KEY_HERE":
            logger.error("TourAPI key is not configured or is set to placeholder.")
            return [], 0

        params = {
            "serviceKey": self.api_key,
            "numOfRows": num_of_rows,
            "pageNo": page_no,
            "MobileOS": "ETC",
            "MobileApp": "travel",
            "_type": "json",
            "cat1": "A01",
            "contentTypeId": 12 # 12 is Tourist Destination (관광지)
        }

        try:
            # We use params for request. If serviceKey is url-encoded, requests will double-encode it.
            # Usually requests does URL encoding. In some public APIs in Korea, the serviceKey is already encoded,
            # so we must decode it first if it contains '%', or handle it carefully.
            # We'll try to fetch with the key as-is first.
            response = requests.get(self.area_list_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            body = data.get("response", {}).get("body", {})
            total_count = body.get("totalCount", 0)
            items_container = body.get("items", {})
            
            items = []
            if isinstance(items_container, dict):
                item_val = items_container.get("item")
                if isinstance(item_val, list):
                    items = item_val
                elif isinstance(item_val, dict):
                    items = [item_val]
            
            return items, total_count
        except Exception as e:
            logger.exception(f"Error fetching nature spots from TourAPI page {page_no}: {e}")
            return [], 0

    def fetch_spot_overview(self, content_id: int) -> str:
        """
        Fetches the overview/introduction description for a specific contentid.
        """
        if not self.api_key or self.api_key == "YOUR_TOUR_API_KEY_HERE":
            return ""

        params = {
            "serviceKey": self.api_key,
            "MobileOS": "ETC",
            "MobileApp": "travel",
            "_type": "json",
            "contentId": content_id
        }
        # In KorService2 (TourAPI 4.0), including 'overviewYN' causes INVALID_REQUEST_PARAMETER_ERROR.
        # Removing it will fetch the overview description by default.
        if "KorService2" not in self.base_url:
            params["overviewYN"] = "Y"

        try:
            response = requests.get(self.detail_common_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            body = data.get("response", {}).get("body", {})
            items_container = body.get("items", {})
            
            if isinstance(items_container, dict):
                item_val = items_container.get("item")
                item = None
                if isinstance(item_val, list) and len(item_val) > 0:
                    item = item_val[0]
                elif isinstance(item_val, dict):
                    item = item_val
                
                if item:
                    return item.get("overview", "")
            return ""
        except Exception as e:
            logger.warning(f"Error fetching overview for content_id {content_id}: {e}")
            return ""

    def fetch_spot_intro(self, content_id: int, content_type_id: int = 12) -> dict:
        """
        Fetches the detailed introduction information (detailIntro) for a specific contentid and contenttypeid.
        """
        if not self.api_key or self.api_key == "YOUR_TOUR_API_KEY_HERE":
            return {}

        params = {
            "serviceKey": self.api_key,
            "MobileOS": "ETC",
            "MobileApp": "travel",
            "_type": "json",
            "contentId": content_id,
            "contentTypeId": content_type_id
        }

        try:
            url = f"{self.base_url}/detailIntro2" if "KorService2" in self.base_url else f"{self.base_url}/detailIntro1"
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            body = data.get("response", {}).get("body", {})
            items_container = body.get("items", {})
            
            if isinstance(items_container, dict):
                item_val = items_container.get("item")
                if isinstance(item_val, list) and len(item_val) > 0:
                    return item_val[0]
                elif isinstance(item_val, dict):
                    return item_val
            return {}
        except Exception as e:
            logger.warning(f"Error fetching intro for content_id {content_id}: {e}")
            return {}


    def sync_nature_spots(self, db: Session, limit: int = None) -> dict:
        """
        Synchronizes TourAPI A01 (Nature) spots into the local database.
        Optionally limits the number of processed spots.
        """
        page_no = 1
        num_of_rows = 50
        total_synced = 0
        total_updated = 0
        total_created = 0
        
        spots_fetched, total_count = self.fetch_nature_spots(page_no=page_no, num_of_rows=num_of_rows)
        if not spots_fetched:
            return {"status": "error", "message": "No data fetched from TourAPI. Check API key or connection."}

        # Keep fetching until all items are synced or limit is reached
        while spots_fetched:
            for spot in spots_fetched:
                if limit is not None and total_synced >= limit:
                    break
                
                content_id = int(spot.get("contentid"))
                title = spot.get("title")
                mapx = spot.get("mapx")
                mapy = spot.get("mapy")
                firstimage = spot.get("firstimage") or spot.get("firstimage2")
                
                # Map API response fields to DB model columns (excluding overview for fast bulk sync)
                spot_data = {
                    "id": content_id,
                    "title": title,
                    "mapx": float(mapx) if mapx else 0.0,
                    "mapy": float(mapy) if mapy else 0.0,
                    "firstimage": firstimage,
                    "cat1": spot.get("cat1"),
                    "cat2": spot.get("cat2"),
                    "cat3": spot.get("cat3"),
                    "contenttypeid": int(spot.get("contenttypeid")) if spot.get("contenttypeid") else None
                }
                
                # Check if it exists to skip redundant database writes
                existing = self.repo.get_by_id(db, content_id)
                if existing:
                    total_updated += 1  # count as already existing/skipped
                    total_synced += 1
                    continue
                
                total_created += 1
                self.repo.upsert_spot(db, spot_data)
                total_synced += 1



            if limit is not None and total_synced >= limit:
                break
            
            # Move to next page
            page_no += 1
            if (page_no - 1) * num_of_rows >= total_count:
                break
                
            spots_fetched, _ = self.fetch_nature_spots(page_no=page_no, num_of_rows=num_of_rows)

        return {
            "status": "success",
            "total_synced": total_synced,
            "created": total_created,
            "updated": total_updated
        }
