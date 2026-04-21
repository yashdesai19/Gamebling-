import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def final_map_rapid():
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
            
            for day in schedules:
                ad_wrapper = day.get("scheduleAdWrapper", {})
                match_list = ad_wrapper.get("matchScheduleList", [])
                
                for entry in match_list:
                    match_info = entry.get("matchInfo", {})
                    if not match_info: continue
                    
                    series_name = match_info.get("seriesName", "")
                    team1 = match_info.get("team1", {}).get("teamName", "TBD")
                    team2 = match_info.get("team2", {}).get("teamName", "TBD")
                    
                    if "indian premier league" in series_name.lower() or "ipl" in series_name.lower():
                        print(f"IPL Match: {team1} vs {team2}")
                        print(f"  Series: {series_name}")
                        print(f"  Date: {match_info.get('startDate')}")
                        print(f"  ID: {match_info.get('matchId')}")
                        print("-" * 20)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    final_map_rapid()
