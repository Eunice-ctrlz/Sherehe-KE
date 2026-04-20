from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Event, Venue
from geoalchemy2.functions import ST_X, ST_Y

router = APIRouter(prefix="/api/v1/events", tags=["events"])

@router.get("/upcoming")
def get_upcoming_events(
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0
):
    """
    Fetch upcoming scraped ticket events (TicketSasa/EventBrite) happening in the next 7 days.
    Provides venue location to cross-reference with real-time heat maps.
    """
    now = datetime.now()
    seven_days = now + timedelta(days=7)
    
    # Phase 5: Query for future events and join the spatial Venue data
    results = db.query(
        Event.event_id,
        Event.event_name,
        Event.event_type,
        Event.event_start,
        Event.data_source,
        Venue.name.label('venue_name'),
        ST_X(Venue.location).label('lng'),
        ST_Y(Venue.location).label('lat')
    ).join(
        Venue, Event.venue_id == Venue.venue_id
    ).filter(
        Event.event_start >= now,
        Event.event_start <= seven_days
    ).order_by(Event.event_start.asc()).offset(offset).limit(limit).all()
    
    events_response = []
    for evt in results:
        events_response.append({
            "event_id": str(evt.event_id),
            "event_name": evt.event_name,
            "event_type": evt.event_type,
            "event_start": evt.event_start.isoformat(),
            "data_source": evt.data_source,
            "venue": {
                "name": evt.venue_name,
                "coordinates": [evt.lng, evt.lat]
            }
        })
        
    return {
        "status": "success",
        "count": len(events_response),
        "events": events_response
    }