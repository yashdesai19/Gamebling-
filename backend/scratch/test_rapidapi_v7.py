import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def test_rapidapi_v7():
    # Trying underscores
    endpoints = ["/get_match_list", "/get_all_matches", "/match_details"]
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    for ep in endpoints:
        url = f"https://{RAPID_HOST}{ep}"
        print(f"Testing RapidAPI endpoint: {url}")
        try:
            res = httpx.get(url, headers=headers, timeout=10)
            print(f"Endpoint: {ep} | Status: {res.status_code}")
            if res.status_code == 200:
                print("SUCCESS!")
                import json
                print(json.dumps(res.json(), indent=2)[:3000])
                break
        except Exception as e:
            print(f"Error on {ep}: {e}")

if __name__ == "__main__":
    test_rapidapi_v7()
