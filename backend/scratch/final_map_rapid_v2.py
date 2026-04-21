import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def final_map_rapid_v2():
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
            
            # If for some reason schedules['schedules'] was a list of dicts that have matchScheduleList
            for day_item in schedules:
                if not isinstance(day_item, dict): continue
                
                # Check scheduleAdWrapper
                ad_wrapper = day_item.get("scheduleAdWrapper", {})
                if not isinstance(ad_wrapper, dict): continue
                
                match_list = ad_wrapper.get("matchScheduleList", [])
                if not isinstance(match_list, list): continue
                
                for entry in match_list:
                    if not isinstance(entry, dict): continue
                    match_info = entry.get("matchInfo")
                    if not match_info:
                        # Some entries are 'ad' entries, skip them
                        continue
                        
                    series_name = match_info.get("seriesName", "")
                    team1 = match_info.get("team1", {}).get("teamName", "TBD")
                    team2 = match_info.get("team2", {}).get("teamName", "TBD")
                    
                    if "indian premier league" in series_name.lower() or "ipl" in series_name.lower():
                        print(f"IPL Match: {team1} vs {team2} | ID: {match_info.get('matchId')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    final_map_rapid_v2()
