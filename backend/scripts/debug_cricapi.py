
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.cricapi_client import CricAPIClient

def main():
    client = CricAPIClient()
    matches = client.fetch_current_matches()
    print(f'Total matches in API: {len(matches)}')
    for m in matches:
        print(f"Name: {m.get('name')}")
        print(f"Series: {m.get('series_id')}")
        print(f"Status: {m.get('status')}")
        print(f"Teams: {m.get('teams')}")
        print('---')

if __name__ == "__main__":
    main()
