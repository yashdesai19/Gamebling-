import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def test_series_match_list():
    # Attempting to fetch full series matches for IPL (SeriesID: 9241)
    url = f"https://{RAPID_HOST}/cricket-series-match-list?seriesId=9241"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    print(f"Testing Series Match List: {url}")
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            import json
            data = res.json()
            print("SUCCESS! Matches found:")
            # Preview first few matches
            match_list = data.get("response", {}).get("match", [])
            print(f"Total matches in series: {len(match_list)}")
            for m in match_list[:5]:
                info = m.get("matchInfo", {})
                print(f"- {info.get('team1', {}).get('teamName')} vs {info.get('team2', {}).get('teamName')} on {info.get('startDate')}")
        else:
            print(f"Error: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_series_match_list()
