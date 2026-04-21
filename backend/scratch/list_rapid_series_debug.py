import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def list_all_series_debug():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            # The structure is data['response']['schedules'] which is a list
            schedules = data.get("response", {}).get("schedules", [])
            print(f"Schedules length: {len(schedules)}")
            
            for i, day in enumerate(schedules):
                if not isinstance(day, dict):
                    print(f"Item {i} is NOT a dict, it is a {type(day)}")
                    continue
                
                # Check for scheduleAdWrapper
                wrapper = day.get("scheduleAdWrapper")
                if not wrapper:
                    # Maybe it's a different wrapper?
                    print(f"Item {i} has no scheduleAdWrapper. Keys: {list(day.keys())}")
                    continue
                
                match_list = wrapper.get("matchScheduleList", [])
                for entry in match_list:
                    info = entry.get("matchInfo")
                    if info:
                        series = info.get("seriesName", "Unknown")
                        print(f"FOUND Match in Series: {series}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_all_series_debug()
