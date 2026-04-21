import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"

def debug_matches():
    url = f"{BASE_URL}/matches"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        matches = body.get("data", [])
        
        print(f"DEBUG: Showing first 15 matches from /matches")
        for m in matches[:15]:
            print(f"- {m.get('name')} | Series: {m.get('series_id')}")
                
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    debug_matches()
