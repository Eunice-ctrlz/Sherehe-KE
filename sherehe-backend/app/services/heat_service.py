from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Pulse, HeatCluster
from geoalchemy2.functions import ST_DWithin, ST_Centroid, ST_ClusterDBSCAN
from sqlalchemy import func

def calculate_heat_clusters(db: Session, latitude: float, longitude: float, radius_meters=500):
    """
    Use PostGIS to cluster pulses within radius
    Returns active hot zones for the user's viewport
    """
    
    # Find all active pulses within the bounding box
    now = datetime.now()
    three_hours_ago = now - timedelta(hours=3)
    
    # Query pulses with decay calculation
    pulses = db.query(Pulse).filter(
        Pulse.created_at >= three_hours_ago,
        ST_DWithin(
            Pulse.location,
            f"POINT({longitude} {latitude})",
            radius_meters
        )
    ).all()
    
    # Calculate decay intensity for each pulse
    clusters = []
    for pulse in pulses:
        age_minutes = (now - pulse.created_at).total_seconds() / 60
        decay_factor = max(0, 1 - (age_minutes / 180))  # Linear decay over 3 hours
        
        clusters.append({
            "pulse_id": str(pulse.pulse_id),
            "lat": pulse.location.y,
            "lng": pulse.location.x,
            "intensity": pulse.intensity * decay_factor,
            "age_minutes": age_minutes
        })
    
    return clusters

def get_heat_from_cache(latitude: float, longitude: float):
    """
    Fetch pre-calculated heat clusters from Redis (updated every 60 seconds)
    This avoids expensive PostGIS queries on every map pan
    """
    import os
    import redis
    import json
    
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    redis_client = redis.from_url(redis_url, decode_responses=True)
    
    cache_key = f"heat:{round(latitude, 2)}:{round(longitude, 2)}"
    
    try:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except redis.RedisError:
        pass
        
    return None