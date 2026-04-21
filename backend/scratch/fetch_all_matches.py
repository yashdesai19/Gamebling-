import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"

def fetch_all_matches():
    # Use /matches endpoint which is more comprehensive for upcoming games
    url = f"{BASE_URL}/matches"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        matches = body.get("data", [])
        
        print(f"Total upcoming matches found: {len(matches)}")
        
        found = []
        for m in matches:
            name = str(m.get("name") or "").lower()
            if "indian premier league" in name or "ipl" in name:
                found.append(m)
                print(f"MATCH: {m.get('name')} | DATE: {m.get('date')} | ID: {m.get('id')}")
        
        if not found:
            print("No IPL matches found in /matches endpoint.")
                
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    fetch_all_matches()
