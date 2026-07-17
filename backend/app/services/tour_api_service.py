import os
import re
import html
import requests
import logging
from sqlalchemy.orm import Session
from app.repositories import TourSpotRepository

logger = logging.getLogger(__name__)

def clean_html(text: str) -> str:
    if not text:
        return ""
    # Unescape HTML entities
    text = html.unescape(text)
    # Replace <br> and <br /> (case-insensitive) with newline
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    # Replace HTML-encoded <br> (like &lt;br&gt; or &lt;br /&gt;) with newline
    text = re.sub(r'&lt;br\s*/?&gt;', '\n', text, flags=re.IGNORECASE)
    # Remove all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()

def clean_dict_html(d: dict) -> dict:
    if not d:
        return {}
    cleaned = {}
    for k, v in d.items():
        if isinstance(v, str):
            cleaned[k] = clean_html(v)
        else:
            cleaned[k] = v
    return cleaned

API_TO_DB_CAT3 = {
    "A01020200": "A01020600",  # 기암괴석
    "A01011600": "A01020500",  # 등대
    "A01011000": "A01020400",  # 약수터
    "A02020700": "A01011300",  # 일반/테마 공원
    "A02011000": "A01020400",  # 안보/역사 공원
}

API_TO_DB_CAT2 = {
    "A01020600": "A0102",
    "A01020500": "A0102",
    "A01020400": "A0102",
    "A01011300": "A0101",
}

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

    def fetch_nature_spots(
        self,
        cat1: str = "A01",
        cat2: str = None,
        cat3: str = None,
        page_no: int = 1,
        num_of_rows: int = 50,
        content_type_id: int = None  # 특정 타겟팅이 필요한 경우에만 사용하도록 변경 (기본값 None)
    ) -> tuple[list, int]:
        """
        Fetches tourist spots from TourAPI with optional category filters.
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
            "cat1": cat1
        }
        if cat2:
            params["cat2"] = cat2
        if cat3:
            params["cat3"] = cat3
        if content_type_id:
            params["contentTypeId"] = content_type_id

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
                    return clean_html(item.get("overview", ""))
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
                    return clean_dict_html(item_val[0])
                elif isinstance(item_val, dict):
                    return clean_dict_html(item_val)
            return {}
        except Exception as e:
            logger.warning(f"Error fetching intro for content_id {content_id}: {e}")
            return {}


    def sync_spots_for_category(
        self,
        db: Session,
        cat1: str,
        cat2: str = None,
        cat3: str = None,
        limit: int = None,
        content_type_id: int = None  # 유연한 동기화를 위해 추가
    ) -> tuple[int, int, int]:
        """
        Synchronizes spots for a specific category code combination into the database.
        Returns a tuple of (total_synced, total_created, total_updated).
        """
        page_no = 1
        num_of_rows = 50
        total_synced = 0
        total_updated = 0
        total_created = 0
        
        spots_fetched, total_count = self.fetch_nature_spots(
            cat1=cat1, cat2=cat2, cat3=cat3, page_no=page_no, num_of_rows=num_of_rows, content_type_id=content_type_id
        )
        if not spots_fetched:
            return 0, 0, 0

        while spots_fetched:
            for spot in spots_fetched:
                if limit is not None and total_synced >= limit:
                    break
                
                content_id = int(spot.get("contentid"))
                title = spot.get("title")
                mapx = spot.get("mapx")
                mapy = spot.get("mapy")
                firstimage = spot.get("firstimage") or spot.get("firstimage2")
                
                raw_cat2 = spot.get("cat2")
                raw_cat3 = spot.get("cat3")
                db_cat3 = API_TO_DB_CAT3.get(raw_cat3, raw_cat3)
                db_cat2 = API_TO_DB_CAT2.get(db_cat3, raw_cat2)

                # Map API response fields to DB model columns (excluding overview for fast bulk sync)
                spot_data = {
                    "id": content_id,
                    "title": title,
                    "mapx": float(mapx) if mapx else 0.0,
                    "mapy": float(mapy) if mapy else 0.0,
                    "firstimage": firstimage,
                    "cat1": spot.get("cat1"),
                    "cat2": db_cat2,
                    "cat3": db_cat3,
                    "contenttypeid": int(spot.get("contenttypeid")) if spot.get("contenttypeid") else 12
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
                
            spots_fetched, _ = self.fetch_nature_spots(
                cat1=cat1, cat2=cat2, cat3=cat3, page_no=page_no, num_of_rows=num_of_rows, content_type_id=content_type_id
            )

        return total_synced, total_created, total_updated

    def sync_nature_spots(self, db: Session, limit: int = None, categories: list[str] = None) -> dict:
        """
        Synchronizes TourAPI spots (Nature and specific Park categories) into the local database.
        Optionally limits the number of processed spots per category.
        """
        if categories is None:
            categories = ['nature', 'general_parks', 'security_parks']
            
        results = {}
        total_synced = 0
        total_created = 0
        total_updated = 0
        
        if 'nature' in categories:
            print("Syncing Nature spots (A01)...")
            # contentTypeId를 아예 넘기지 않아서 A01(자연) 카테고리 내의 모든 타입(관광지 12, 레포츠 28 등)을 전부 가져옵니다.
            synced_nat, created_nat, updated_nat = self.sync_spots_for_category(db, cat1="A01", limit=limit)
            results["nature"] = {"synced": synced_nat, "created": created_nat, "updated": updated_nat}
            total_synced += synced_nat
            total_created += created_nat
            total_updated += updated_nat
            
        if 'general_parks' in categories:
            print("Syncing General/Theme Parks (A02020700)...")
            # 일반/테마 공원도 contentTypeId를 제거하여 레포츠 등으로 잘못 속해있던 공원까지 수집합니다.
            synced_gen, created_gen, updated_gen = self.sync_spots_for_category(
                db, cat1="A02", cat2="A0202", cat3="A02020700", limit=limit
            )
            results["general_parks"] = {"synced": synced_gen, "created": created_gen, "updated": updated_gen}
            total_synced += synced_gen
            total_created += created_gen
            total_updated += updated_gen
            
        if 'security_parks' in categories:
            print("Syncing Security/History Parks (A02011000)...")
            synced_sec, created_sec, updated_sec = self.sync_spots_for_category(
                db, cat1="A02", cat2="A0201", cat3="A02011000", limit=limit
            )
            results["security_parks"] = {"synced": synced_sec, "created": created_sec, "updated": updated_sec}
            total_synced += synced_sec
            total_created += created_sec
            total_updated += updated_sec
            
        return {
            "status": "success",
            "total_synced": total_synced,
            "created": total_created,
            "updated": total_updated,
            "details": results
        }