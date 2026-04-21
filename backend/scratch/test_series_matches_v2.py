import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def test_series_match_list_v2():
    # Attempting to fetch series match list by ID
    url = f"https://{RAPID_HOST}/cricket-match-list-by-series-id?seriesId=9241"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    print(f"Testing: {url}")
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            matches = data.get("response", {}).get("match", [])
            print(f"SUCCESS! Total matches found in series: {len(matches)}")
            if len(matches) > 0:
                # Print the last match to see the date
                last_m = matches[-1].get("matchInfo", {})
                print(f"Last match: {last_m.get('team1', {}).get('teamName')} vs {last_m.get('team2', {}).get('teamName')} on {last_m.get('startDate')}")
        else:
            print(f"Error: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_series_match_list_v2()
