from app.services.cricapi_client import CricAPIClient
import json

client = CricAPIClient()
matches = client.fetch_current_matches()

print(f"Total matches: {len(matches)}")
print()
# Print ALL keys from first match
for i, m in enumerate(matches[:5]):
    print(f"=== Match {i+1} ===")
    print(json.dumps({k: v for k, v in m.items() if k not in ("score",)}, indent=2, default=str))
    print()
