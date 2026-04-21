import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"

def inspect_api_dates():
    url = f"{BASE_URL}/currentMatches"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        matches = body.get("data", [])
        
        print(f"{'Match Name':<50} | {'Date GMT':<25} | {'ID'}")
        print("-" * 90)
        
        for m in matches:
            series = str(m.get("series_id") or "").lower()
            name = str(m.get("name") or "").lower()
            if any(term in text for term in ["ipl", "indian premier league"] for text in [series, name]):
                print(f"{m.get('name')[:50]:<50} | {str(m.get('dateTimeGMT')):<25} | {m.get('id')}")
            
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    inspect_api_dates()
