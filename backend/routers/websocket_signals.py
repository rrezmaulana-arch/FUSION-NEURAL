# Project: FUSION NEURAL
# routers/websocket_signals.py — WebSocket Real-Time Signals (Solusi #4)
#
# Menggantikan polling onSnapshot Firestore untuk data transien (status AI, thinking, dll.)
# Arsitektur: FastAPI WebSocket → broadcast ke semua connected React clients
# Keuntungan: 90% hemat Firestore reads, 0ms latency, tidak ada biaya database

import asyncio
from datetime import datetime, timezone
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Registry semua client yang terhubung saat ini
_connected_clients: Set[WebSocket] = set()


class SignalBroadcaster:
    """Manajemen koneksi WebSocket dan broadcast sinyal AI."""

    def __init__(self):
        self.clients: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.clients.add(ws)
        print(f"[ws] ✅ Client terhubung. Total: {len(self.clients)}")
        # Kirim handshake konfirmasi
        await ws.send_json({
            "type": "CONNECTED",
            "message": "Neural WebSocket aktif",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    def disconnect(self, ws: WebSocket):
        self.clients.discard(ws)
        print(f"[ws] Client terputus. Sisa: {len(self.clients)}")

    async def broadcast(self, data: dict):
        """Kirim pesan ke semua client yang terhubung."""
        if not self.clients:
            return
        dead = set()
        for ws in self.clients.copy():
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        # Bersihkan koneksi mati
        for ws in dead:
            self.clients.discard(ws)

    async def send_agent_signal(self, agent: str, status: str, message: str):
        """Helper untuk mengirim sinyal status agen."""
        await self.broadcast({
            "type": "AGENT_SIGNAL",
            "agent": agent,
            "status": status,  # THINKING | WORKING | IDLE | ERROR
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    async def send_task_update(self, task_id: str, status: str, agent: str, result: str = ""):
        """Helper untuk update status task di Kanban board."""
        await self.broadcast({
            "type": "TASK_UPDATE",
            "taskId": task_id,
            "status": status,  # To Do | In Progress | Done
            "agent": agent,
            "result": result[:200] if result else "",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })


# Singleton broadcaster — digunakan oleh semua router lain
broadcaster = SignalBroadcaster()


@router.websocket("/ws/signals")
async def websocket_endpoint(websocket: WebSocket):
    """
    Endpoint WebSocket utama.
    Frontend terhubung ke: ws://localhost:8001/ws/signals
    atau: wss://your-ngrok-url.ngrok-free.dev/ws/signals
    """
    await broadcaster.connect(websocket)
    try:
        # Pertahankan koneksi — kirim ping setiap 30 detik agar tidak timeout
        while True:
            try:
                # Tunggu pesan dari client (dengan timeout 30 detik)
                data = await asyncio.wait_for(websocket.receive_json(), timeout=30)
                # Jika client mengirim ping, balas pong
                if data.get("type") == "PING":
                    await websocket.send_json({
                        "type": "PONG",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
            except asyncio.TimeoutError:
                # Kirim heartbeat ke client agar tahu koneksi masih hidup
                await websocket.send_json({
                    "type": "HEARTBEAT",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)
    except Exception as e:
        print(f"[ws] ❌ Error: {e}")
        broadcaster.disconnect(websocket)
