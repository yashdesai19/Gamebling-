import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def recursive_search_matches(data, matches_found):
    if isinstance(data, list):
        for item in data:
            recursive_search_matches(item, matches_found)
    elif isinstance(data, dict):
        if "matchInfo" in data and "matchId" in data["matchInfo"]:
            matches_found.append(data["matchInfo"])
        else:
            for v in data.values():
                recursive_search_matches(v, matches_found)

def fetch_and_find_ipl():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            all_match_infos = []
            recursive_search_matches(data, all_match_infos)
            
            print(f"Total Match Info objects found: {len(all_match_infos)}")
            
            for info in all_match_infos:
                series_name = str(info.get("seriesName", "")).lower()
                if "ipl" in series_name or "indian premier league" in series_name:
                    print(f"MATCH: {info.get('team1', {}).get('teamName')} vs {info.get('team2', {}).get('teamName')}")
                    print(f"  Series: {info.get('seriesName')}")
                    print(f"  Date: {info.get('startDate')}")
                    print(f"  ID: {info.get('matchId')}")
                    print("-" * 15)
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_and_find_ipl()
