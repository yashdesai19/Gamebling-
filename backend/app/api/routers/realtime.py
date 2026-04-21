from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.realtime.manager import manager


router = APIRouter(tags=["realtime"])


@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "invalid_json"}))
                continue

            action = msg.get("action")
            topic = msg.get("topic")
            if action == "subscribe" and isinstance(topic, str):
                await manager.subscribe(websocket, topic)
                await websocket.send_text(json.dumps({"status": "subscribed", "topic": topic}))
            elif action == "unsubscribe" and isinstance(topic, str):
                await manager.unsubscribe(websocket, topic)
                await websocket.send_text(json.dumps({"status": "unsubscribed", "topic": topic}))
            else:
                await websocket.send_text(json.dumps({"error": "invalid_action"}))
    except WebSocketDisconnect:
        await manager.disconnect(websocket)

