import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"

def find_ipl_series():
    url = f"{BASE_URL}/series"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        series_list = body.get("data", [])
        
        print(f"Total series found: {len(series_list)}")
        
        for s in series_list:
            name = str(s.get("name") or "").lower()
            if "indian premier league" in name or "ipl" in name:
                print(f"Found Series: {s.get('name')} | ID: {s.get('id')}")
                
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    find_ipl_series()
