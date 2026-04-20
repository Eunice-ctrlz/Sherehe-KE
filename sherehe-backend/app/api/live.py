from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from typing import Dict, Tuple

router = APIRouter(prefix="/api/v1/live", tags=["live"])

class ConnectionManager:
    def __init__(self):
        # Map websocket to its current viewport: (sw_lng, sw_lat, ne_lng, ne_lat)
        self.active_connections: Dict[WebSocket, Tuple[float, float, float, float]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        # Default empty viewport [sw_lng, sw_lat, ne_lng, ne_lat]
        self.active_connections[websocket] = (0, 0, 0, 0)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    def update_viewport(self, websocket: WebSocket, bbox: Tuple[float, float, float, float]):
        self.active_connections[websocket] = bbox

    async def broadcast_pulse(self, pulse_data: dict):
        """
        Broadcast a new pulse to all connections whose viewport contains the pulse.
        Reduces unnecessary bandwidth by 80%+ since users far away won't get the payload.
        """
        lat = pulse_data["geometry"]["coordinates"][1]
        lng = pulse_data["geometry"]["coordinates"][0]
        
        dead_connections = []
        for ws, bbox in self.active_connections.items():
            sw_lng, sw_lat, ne_lng, ne_lat = bbox
            
            # Check if pulse is within client's bounding box
            if sw_lng <= lng <= ne_lng and sw_lat <= lat <= ne_lat:
                try:
                    await ws.send_json(pulse_data)
                except WebSocketDisconnect:
                    dead_connections.append(ws)
                except Exception:
                    dead_connections.append(ws)
        
        # Cleanup disconnected clients
        for ws in dead_connections:
            self.disconnect(ws)

manager = ConnectionManager()

@router.websocket("")
async def websocket_live_endpoint(websocket: WebSocket):
    """
    WebSocket Live Endpoint.
    Clients connect and send their bounding box to subscribe to live pulse updates.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Client sends: {"action": "update_viewport", "bbox": [sw_lng, sw_lat, ne_lng, ne_lat]}
                if message.get("action") == "update_viewport" and "bbox" in message:
                    try:
                        # Enforce validation on input datatypes
                        bbox = tuple(float(x) for x in message["bbox"])
                        if len(bbox) == 4:
                            manager.update_viewport(websocket, bbox)
                            await websocket.send_json({
                                "status": "viewport_updated", 
                                "bbox": bbox,
                                "type": "SystemMessage"
                            })
                        else:
                            await websocket.send_json({"error": "bbox must contain exactly 4 coordinates [sw_lng, sw_lat, ne_lng, ne_lat]", "type": "ErrorMessage"})
                    except (ValueError, TypeError):
                        await websocket.send_json({"error": "bbox elements must be numbers", "type": "ErrorMessage"})
                else:
                    await websocket.send_json({"error": "Invalid action or missing bbox parameter", "type": "ErrorMessage"})
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Malformed JSON", "type": "ErrorMessage"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        # Catching abrupt terminations
        manager.disconnect(websocket)
