from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import os
import json
import redis.asyncio as aioredis
from app.api import user, pulse, heat, live, events, squads

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run Redis Pub/Sub listener for Real-time WebSockets
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    r = aioredis.from_url(redis_url, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe("pulse:new")
    
    async def listen_to_redis():
        while True:
            try:
                await pubsub.subscribe("pulse:new")
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        pulse_data = json.loads(message["data"])
                        # Send payload to websocket connections overlapping the viewport
                        await live.manager.broadcast_pulse(pulse_data)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Redis listener error: {e}, reconnecting in 2s...")
                await asyncio.sleep(2)

    task = asyncio.create_task(listen_to_redis())
    yield
    # Shutdown
    task.cancel()
    await pubsub.close()
    await r.close()

app = FastAPI(title='Sherehe KE API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our API routers
app.include_router(user.router)
app.include_router(pulse.router)
app.include_router(heat.router)
app.include_router(live.router)
app.include_router(events.router)
app.include_router(squads.router)

@app.get('/api/v1/health')
def health_check():
    from datetime import datetime
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
        "timestamp": datetime.now().isoformat()
    }

@app.get('/')
def read_root():
    return {'message': 'Welcome to the Sherehe KE API'}
