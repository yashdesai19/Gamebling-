import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

CRIC_KEY = os.getenv("CRICAPI_KEY")

def check_cricapi_full_range():
    # Fetching matches from CricAPI to see if they have the full IPL season
    url = f"https://api.cricapi.com/v1/matches?apikey={CRIC_KEY}&offset=0"
    
    print(f"Checking CricAPI: {url}")
    try:
        res = httpx.get(url, timeout=15)
        if res.status_code == 200:
            data = res.json()
            matches = data.get("data", [])
            print(f"Total matches in CricAPI: {len(matches)}")
            
            ipl_matches = []
            for m in matches:
                series = m.get("series_id", "")
                name = m.get("name", "")
                if "indian premier league" in name.lower() or "ipl" in name.lower():
                    ipl_matches.append(m)
            
            print(f"IPL Matches in CricAPI: {len(ipl_matches)}")
            if ipl_matches:
                # Sort by date
                ipl_matches.sort(key=lambda x: x.get("date", ""))
                print(f"First IPL Match: {ipl_matches[0].get('name')} on {ipl_matches[0].get('date')}")
                print(f"Last IPL Match: {ipl_matches[-1].get('name')} on {ipl_matches[-1].get('date')}")
        else:
            print(f"Error: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_cricapi_full_range()
