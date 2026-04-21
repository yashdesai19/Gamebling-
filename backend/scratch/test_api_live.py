import httpx
import os

API_KEY = "9b5dcf2d-907b-4428-8706-f7f6595f3260"
BASE_URL = "https://api.cricapi.com/v1"

def test_api():
    url = f"{BASE_URL}/currentMatches"
    params = {"apikey": API_KEY, "offset": 0}
    try:
        res = httpx.get(url, params=params, timeout=10)
        res.raise_for_status()
        body = res.json()
        print("API Response Received:")
        print(body.get("status"))
        matches = body.get("data", [])
        print(f"Total Matches Found: {len(matches)}")
        
        # Look for IPL matches
        for m in matches[:5]:
            print(f"Match: {m.get('name')} | ID: {m.get('id')} | Series: {m.get('series_id')}")
            
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    test_api()
