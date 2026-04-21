import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"

def list_all_series():
    url = f"{BASE_URL}/series"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        series_list = body.get("data", [])
        
        print(f"Total series found: {len(series_list)}")
        for s in series_list:
            print(f"ID: {s.get('id')} | Name: {s.get('name')}")
                
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    list_all_series()
