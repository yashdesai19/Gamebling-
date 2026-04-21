import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def inspect_ipl_in_rapid():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            # The structure appears to be: { "matchSchedule": [ { "scheduleAd": ... }, { "match": [...] }, ... ] }
            # Or just a list. Let's find matches.
            
            # Let's iterate through everything to find any match with "IPL" or "Indian Premier League"
            import json
            raw_text = json.dumps(data).lower()
            if "indian premier league" in raw_text or "ipl" in raw_text:
                print("IPL matches FOUND in the response!")
            else:
                print("IPL matches NOT FOUND in the raw response text.")
                
            # Print the keys to understand the structure better
            print(f"Top level keys: {list(data.keys())}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_ipl_in_rapid()
