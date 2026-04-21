import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def test_rapidapi():
    url = f"https://{RAPID_HOST}/matches"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    print(f"Testing RapidAPI: {url}")
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            # The structure for this API is usually: { "status": ..., "data": { "matches": [...] } }
            # Or sometimes: { "results": [...] }
            print("Response Sample:")
            import json
            print(json.dumps(data, indent=2)[:2000]) # Print first 2000 chars
        else:
            print(f"Error Body: {res.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_rapidapi()
