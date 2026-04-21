import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"

def search_teams():
    url = f"{BASE_URL}/currentMatches"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        matches = body.get("data", [])
        
        print(f"Total matches in API: {len(matches)}")
        
        found = False
        for m in matches:
            name = str(m.get("name") or "").lower()
            if "hyderabad" in name or "delhi" in name or "srh" in name or "dc" in name:
                print(f"MATCH FOUND: {m.get('name')} | Series ID: {m.get('series_id')} | Status: {m.get('status')}")
                found = True
        
        if not found:
            print("No matches matching SRH or DC found in the current API response.")
            
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    search_teams()
