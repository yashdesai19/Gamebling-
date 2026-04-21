import httpx
import os
from dotenv import load_dotenv

# Load from backend/.env
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"

def inspect_api():
    url = f"{BASE_URL}/currentMatches"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        print(f"Status: {body.get('status')}")
        matches = body.get("data", [])
        print(f"Total Matches in API: {len(matches)}")
        
        ipl_found = []
        for m in matches:
            series = str(m.get("series_id") or "").lower()
            name = str(m.get("name") or "").lower()
            # Log all match names to see what we are getting
            print(f"Check: {m.get('name')} | Series: {m.get('series_id')}")
            
            if any(term in text for term in ["ipl", "indian premier league"] for text in [series, name]):
                ipl_found.append(m)
        
        print("\n--- IPL FILTERED ---")
        for m in ipl_found:
            print(f"IPL Match: {m.get('name')} | ID: {m.get('id')}")
            
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    inspect_api()
