from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Pulse, Device, Venue
from app.services.device_service import get_or_create_device, calculate_device_level
import redis
import os
import json

router = APIRouter(prefix="/api/v1/pulse", tags=["pulse"])

def get_redis():
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    return redis.from_url(redis_url, decode_responses=True)

class PulseRequest(BaseModel):
    lat: float
    lng: float
    device_id: str
    venue: Optional[str] = None

@router.post("")
def create_pulse(
    request: PulseRequest,
    db: Session = Depends(get_db)
):
    """Drop a new vibe pulse"""
    redis_client = get_redis()
    
    # Get or create device (hashing inside service)
    device = get_or_create_device(request.device_id, db)

    # Rate limit: 1 pulse per hour per hashed device
    cache_key = f"pulse:{device.device_fingerprint}"
    try:
        if redis_client.exists(cache_key):
            raise HTTPException(status_code=429, detail="Rate limited. One pulse per hour per device")
    except redis.RedisError:
        pass # allow if redis is down
    
    # Handle optional venue location
    venue_id = None
    if request.venue:
        venue_obj = db.query(Venue).filter(Venue.name == request.venue).first()
        if not venue_obj:
            venue_obj = Venue(
                name=request.venue, 
                location=f"POINT({request.lng} {request.lat})",
                venue_type="unknown"
            )
            db.add(venue_obj)
            db.commit()
            db.refresh(venue_obj)
        venue_id = venue_obj.venue_id
    
    # Create pulse
    pulse = Pulse(
        device_id=device.device_id,
        venue_id=venue_id,
        location=f"POINT({request.lng} {request.lat})",
        intensity=1.0,
        created_at=datetime.now()
    )
    
    db.add(pulse)
    device.total_points += 10
    device.level = calculate_device_level(device.total_points)
    device.last_pulse_at = datetime.now()
    
    db.commit()
    db.refresh(pulse)
    
    try:
        # Set rate limit cooldown (1 hour)
        redis_client.setex(cache_key, 3600, "1")
        # Invalidate related bbox cache loosely, or trigger background worker
        redis_client.publish("heat:recalculate", f"{request.lat},{request.lng}")
        
        # Publish exact newly created pulse logic back to Redis for WebSockets
        pulse_feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [request.lng, request.lat]
            },
            "properties": {
                "intensity": 1.0,
                "venue": request.venue,
                "expires": (datetime.now() + timedelta(hours=3)).isoformat(),
                "age_hours": 0.0,
                "pulse_id": str(pulse.pulse_id),
                "is_new": True
            }
        }
        redis_client.publish("pulse:created", json.dumps(pulse_feature))
        # Keep broadcasting to websocket listener if that listens on pulse:new 
        redis_client.publish("pulse:new", json.dumps(pulse_feature))
    except redis.RedisError:
        pass
    
    return {
        "status": "pulsed",
        "expires_in": 10800
    }