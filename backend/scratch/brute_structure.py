import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def brute_structure():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            resp = data.get("response", {})
            print(f"Response Type: {type(resp)}")
            if isinstance(resp, list):
                print(f"Response[0] Type: {type(resp[0])}")
            elif isinstance(resp, dict):
                sched = resp.get("schedules", [])
                print(f"Schedules Type: {type(sched)}")
                if len(sched) > 0:
                    print(f"Matches[0] Type: {type(sched[0])}")
                    print(f"Matches[0] Value: {str(sched[0])[:500]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    brute_structure()
