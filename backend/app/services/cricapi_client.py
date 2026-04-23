from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


class CricAPIClient:
    def __init__(self) -> None:
        self.base_url = (settings.cricapi_base_url or "https://api.cricapi.com/v1").rstrip("/")
        self.api_key = (settings.cricapi_api_key or "").strip()
        self.timeout = max(5, int(settings.cricapi_timeout_seconds))

    def enabled(self) -> bool:
        return bool(self.api_key)

    def fetch_current_matches(self) -> list[dict[str, Any]]:
        """Fetch current/live matches from CricAPI."""
        if not self.enabled():
            return []

        url = f"{self.base_url}/currentMatches"
        params = {"apikey": self.api_key, "offset": 0}
        with httpx.Client(timeout=self.timeout, trust_env=False) as client:
            res = client.get(url, params=params)
            res.raise_for_status()
            body = res.json()

        data = body.get("data")
        if isinstance(data, list):
            return [x for x in data if isinstance(x, dict)]
        return []

    def fetch_match_info(self, match_id: str) -> dict[str, Any] | None:
        """Fetch detailed info for a specific match by CricAPI id."""
        if not self.enabled() or not match_id:
            return None

        url = f"{self.base_url}/match_info"
        params = {"apikey": self.api_key, "id": match_id}
        with httpx.Client(timeout=self.timeout, trust_env=False) as client:
            res = client.get(url, params=params)
            if res.status_code != 200:
                return None
            body = res.json()

        data = body.get("data")
        return data if isinstance(data, dict) else None
