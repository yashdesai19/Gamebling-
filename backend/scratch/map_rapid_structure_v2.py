import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def map_rapid_structure_v2():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            response_list = data.get("response", [])
            
            for item in response_list:
                if not isinstance(item, dict): continue
                match_schedule = item.get("matchSchedule", [])
                if not isinstance(match_schedule, list): continue
                
                for entry in match_schedule:
                    if not isinstance(entry, dict): continue
                    matches_list = entry.get("match", [])
                    if not isinstance(matches_list, list): continue
                    
                    for m in matches_list:
                        if not isinstance(m, dict): continue
                        info = m.get("matchInfo", {})
                        if not info: continue
                        
                        series_name = info.get("seriesName", "")
                        team1 = info.get("team1", {}).get("teamName", "TBD")
                        team2 = info.get("team2", {}).get("teamName", "TBD")
                        
                        if "indian premier league" in series_name.lower() or "ipl" in series_name.lower():
                            print(f"FOUND: {team1} vs {team2}")
                            print(f"  Series: {series_name}")
                            print(f"  Date: {info.get('startDate')}")
                            print(f"  ID: {info.get('matchId')}")
                            # Also check for live score/status fields if present
                            print(f"  Live? {info.get('state')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    map_rapid_structure_v2()
