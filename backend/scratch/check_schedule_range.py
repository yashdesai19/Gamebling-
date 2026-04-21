import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def check_schedule_range():
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
            print(f"Total schedule groups (days): {len(schedules)}")
            
            for i, day in enumerate(schedules):
                wrapper = day.get("scheduleAdWrapper", {})
                date_str = wrapper.get("date", "N/A")
                print(f"Day {i}: {date_str}")
                
                # Check for IPL matches in this day
                match_list = wrapper.get("matchScheduleList", [])
                for entry in match_list:
                    if "indian premier league" in entry.get("seriesName", "").lower():
                        print(f"  -> IPL Match available on {date_str}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schedule_range()
