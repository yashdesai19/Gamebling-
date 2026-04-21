import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.cricapi_client import CricAPIClient
from app.core.config import settings

def test():
    client = CricAPIClient()
    print(f"Base URL: {client.base_url}")
    print(f"API Key: {client.api_key[:5]}...{client.api_key[-5:] if client.api_key else ''}")
    
    if not client.enabled():
        print("CricAPI is disabled (no API key).")
        return

    try:
        matches = client.fetch_current_matches()
        print(f"Found {len(matches)} current matches.")
        for m in matches[:3]:
            print(f"- {m.get('name')} | {m.get('status')}")
            # print(f"  Series: {m.get('series_name') or m.get('series')}")
    except Exception as e:
        print(f"Error fetching matches: {e}")

if __name__ == "__main__":
    test()
