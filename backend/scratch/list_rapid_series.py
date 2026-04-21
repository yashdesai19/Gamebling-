import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def list_all_series():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            schedules = data.get("response", {}).get("schedules", [])
            
            series_found = set()
            for day in schedules:
                ad_wrapper = day.get("scheduleAdWrapper", {})
                match_list = ad_wrapper.get("matchScheduleList", [])
                for entry in match_list:
                    info = entry.get("matchInfo")
                    if info:
                        series_found.add(info.get("seriesName", "UNKNOWN"))
            
            print("Unique Series Names in RapidAPI Response:")
            for s in sorted(list(series_found)):
                print(f"- {s}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_all_series()
