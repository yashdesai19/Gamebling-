import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def map_rapid_structure():
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
            
            # This API often groups matches by date or category
            for item in response_list:
                match_schedule = item.get("matchSchedule", [])
                for entry in match_schedule:
                    matches_list = entry.get("match", [])
                    for m in matches_list:
                        info = m.get("matchInfo", {})
                        series_name = info.get("seriesName", "")
                        match_name = f"{info.get('team1', {}).get('teamName')} vs {info.get('team2', {}).get('teamName')}"
                        
                        # Filter for IPL
                        if "indian premier league" in series_name.lower() or "ipl" in series_name.lower():
                            print(f"IPL Match: {match_name}")
                            print(f"  Series: {series_name}")
                            print(f"  Date MS: {info.get('startDate')}")
                            print(f"  Venue: {info.get('venueInfo', {}).get('ground')}, {info.get('venueInfo', {}).get('city')}")
                            print(f"  ID: {info.get('matchId')}")
                            print("-" * 20)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    map_rapid_structure()
