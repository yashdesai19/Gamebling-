from __future__ import annotations

import os
from typing import Any

import httpx
from app.core.config import settings


class RapidAPIClient:
    """Client for the 'Cricket API Free Data' on RapidAPI."""

    def __init__(self) -> None:
        self.api_key = (settings.rapidapi_key or os.getenv("X-RapidAPI-Key", "")).strip()
        self.api_host = (settings.rapidapi_host or os.getenv("X-RapidAPI-Host", "cricket-api-free-data.p.rapidapi.com")).strip()
        self.base_url = f"https://{self.api_host}"
        self.timeout = max(5, int(settings.rapidapi_timeout_seconds))

    def enabled(self) -> bool:
        return bool(self.api_key)

    def fetch_fixtures(self) -> dict[str, Any] | None:
        """Fetch match schedule/fixtures."""
        if not self.enabled():
            return None

        url = f"{self.base_url}/cricket-schedule"
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.api_host
        }
        
        try:
            with httpx.Client(timeout=self.timeout, trust_env=False) as client:
                res = client.get(url, headers=headers)
                res.raise_for_status()
                return res.json()
        except Exception:
            return None
