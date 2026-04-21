import httpx
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

RAPID_KEY = os.getenv("X-RapidAPI-Key")
RAPID_HOST = os.getenv("X-RapidAPI-Host")

def explore_rapid():
    url = f"https://{RAPID_HOST}/cricket-schedule"
    headers = {
        "X-RapidAPI-Key": RAPID_KEY,
        "X-RapidAPI-Host": RAPID_HOST
    }
    
    try:
        res = httpx.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            
            def print_struct(obj, depth=0, max_depth=4):
                if depth > max_depth: return
                prefix = "  " * depth
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        print(f"{prefix}Key: {k} (Type: {type(v).__name__})")
                        if isinstance(v, (dict, list)):
                            print_struct(v, depth+1)
                elif isinstance(obj, list) and obj:
                    print(f"{prefix}[Item 0 Structure]:")
                    print_struct(obj[0], depth+1)

            print_struct(data)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    explore_rapid()
