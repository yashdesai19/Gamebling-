import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def debug_ipl_item():
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
            
            found = False
            for day in schedules:
                match_list = day.get("scheduleAdWrapper", {}).get("matchScheduleList", [])
                for entry in match_list:
                    series_name = entry.get("seriesName", "")
                    if "indian premier league" in series_name.lower():
                        import json
                        print("FOUND IPL ENTRY:")
                        print(json.dumps(entry, indent=2))
                        found = True
                        break
                if found: break
            
            if not found:
                print("IPL NOT FOUND in schedules list.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_ipl_item()
