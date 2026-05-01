from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int):
        await websocket.accept()
        self.active_connections.setdefault(project_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: int):
        connections = self.active_connections.get(project_id, [])
        try:
            connections.remove(websocket)
        except ValueError:
            pass

    async def broadcast_to_project(self, project_id: int, message: dict):
        dead: List[WebSocket] = []
        for ws in self.active_connections.get(project_id, []):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, project_id)


manager = ConnectionManager()
