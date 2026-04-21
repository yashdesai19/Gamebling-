import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def test_rapidapi_final():
    # Found from screenshot!
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    print(f"Testing RapidAPI endpoint: {url}")
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            import json
            data = res.json()
            print("SUCCESS! Structure Preview:")
            print(json.dumps(data, indent=2)[:3000])
        else:
            print(f"Error: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_rapidapi_final()
