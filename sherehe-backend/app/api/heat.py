from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.types import Geometry
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Pulse, Venue
from geoalchemy2.functions import ST_MakeEnvelope, ST_X, ST_Y
import json
import redis
import os

router = APIRouter(prefix="/api/v1/heat", tags=["heat"])

def get_redis():
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    return redis.from_url(redis_url, decode_responses=True)

@router.get("")
def get_heat(
    ne_lat: float = Query(..., description="North East Latitude"),
    ne_lng: float = Query(..., description="North East Longitude"),
    sw_lat: float = Query(..., description="South West Latitude"),
    sw_lng: float = Query(..., description="South West Longitude"),
    db: Session = Depends(get_db)
):
    """
    Fetch visible pulses in a bounding box (GeoJSON format).
    Uses Redis caching for 60s to reduce load.
    """
    redis_client = get_redis()

    # Simple hash for cache key based on bbox
    cache_key = f"heat:{ne_lat}:{ne_lng}:{sw_lat}:{sw_lng}"

    try:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except redis.RedisError:
        pass # Ignore redis errors if it is down

    now = datetime.now()
    envelope = ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)

    features = []

    # Read individual points directly and decay on DB read
    three_hours_ago = now - timedelta(hours=3)
    results = db.query(
        Pulse,
        ST_X(func.cast(Pulse.location, Geometry)).label('lng'),
        ST_Y(func.cast(Pulse.location, Geometry)).label('lat'),
        Venue.name.label('venue_name')
    ).outerjoin(
        Venue, Pulse.venue_id == Venue.venue_id
    ).filter(
        func.ST_Intersects(Pulse.location, envelope),
        Pulse.created_at >= three_hours_ago
    ).all()

    for pulse, lng, lat, venue_name in results:
        # Calculate decay: intensity = 1.0 - (age_hours / 3.0)
        age_hours = (now - pulse.created_at).total_seconds() / 3600.0
        intensity = max(0.1, 1.0 - (age_hours / 3.0))

        features.append({
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "intensity": round(intensity, 2),
                "venue": venue_name,
                "expires": (pulse.created_at + timedelta(hours=3)).strftime('%Y-%m-%dT%H:%M:%S'),
                "age_hours": round(age_hours, 2)
            }
        })

    try:
        # Cache for 60 seconds
        redis_client.setex(cache_key, 60, json.dumps(features))
    except redis.RedisError:
        pass

    return features
