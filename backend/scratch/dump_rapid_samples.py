import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def dump_raw_samples():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            # print first level types
            for k, v in data.items():
                print(f"Key: {k}, Type: {type(v)}")
            
            # Find any seriesName in the whole thing
            import json
            raw = json.dumps(data)
            # Find where 'indian premier league' is
            index = raw.lower().find("indian premier league")
            if index != -1:
                print(f"Found IPL at index {index}")
                print("Context:")
                print(raw[index-500:index+1500])
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_raw_samples()
