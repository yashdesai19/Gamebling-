from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._topics: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            for conns in self._topics.values():
                conns.discard(websocket)

    async def subscribe(self, websocket: WebSocket, topic: str) -> None:
        async with self._lock:
            self._topics[topic].add(websocket)

    async def unsubscribe(self, websocket: WebSocket, topic: str) -> None:
        async with self._lock:
            self._topics.get(topic, set()).discard(websocket)

    async def publish(self, topic: str, message: dict[str, Any]) -> None:
        payload = json.dumps({"topic": topic, "data": message}, default=str)
        async with self._lock:
            conns = list(self._topics.get(topic, set()))
        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception:
                await self.disconnect(ws)


manager = WebSocketManager()

