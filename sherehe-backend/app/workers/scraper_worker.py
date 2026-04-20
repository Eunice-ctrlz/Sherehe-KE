import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import logging

from app.core.celery_app import celery_app
from app.database import SessionLocal
from app.models import Event, Venue

logger = logging.getLogger(__name__)

# Note: TicketSasa scraping structures update often. 
# This is a scalable architectural template for the Phase 5 implementation.
def fetch_ticketsasa_events():
    events_found = []
    # In a real scenario, you would parse actual tags here.
    # r = requests.get('https://www.ticketsasa.com/events')
    # soup = BeautifulSoup(r.text, 'html.parser')
    # for item in soup.select('.event-card'): ...
    
    # Mocking expected output format from parser:
    logger.info("Scraping Event sources...")
    events_found.append({
        "event_name": "Afro-House Friday",
        "venue_name": "The Alchemist",
        "event_type": "dj",
        "event_start": datetime.now().replace(hour=20, minute=0, second=0),
        "data_source": "ticketsasa",
    })
    return events_found

@celery_app.task
def scrape_daily_events():
    """
    Background worker that runs daily at 6AM to fetch upcoming events from
    3rd-party ticketing platforms and populates the Event and Venue tables.
    """
    db = SessionLocal()
    try:
        scraped_data = fetch_ticketsasa_events()
        new_events = 0
        
        for data in scraped_data:
            # 1. Check if we already have this event for this venue
            venue_name = data["venue_name"]
            event_name = data["event_name"]
            
            # Find or auto-create Venue
            venue = db.query(Venue).filter(Venue.name.ilike(f"%{venue_name}%")).first()
            if not venue:
                # If venue doesn't exist, create it at a dummy coordinate
                # In prod, you'd use a Geocoder (e.g., Google Maps API) to get real lat/lng
                venue = Venue(
                    name=venue_name, 
                    location="POINT(36.82 -1.28)", # Default Nairobi center 
                    venue_type="event_space"
                )
                db.add(venue)
                db.commit()
                db.refresh(venue)
                
            # Find if Event exists already (to avoid dupes on daily re-runs)
            existing_event = db.query(Event).filter(
                Event.event_name == event_name,
                Event.venue_id == venue.venue_id,
                Event.event_start >= datetime.now().date()
            ).first()
            
            if not existing_event:
                new_evt = Event(
                    venue_id=venue.venue_id,
                    event_name=event_name,
                    event_type=data["event_type"],
                    event_start=data["event_start"],
                    data_source=data["data_source"]
                )
                db.add(new_evt)
                new_events += 1
                
        db.commit()
        logger.info(f"Phase 5 Scraper Worker: Added {new_events} new upcoming events via TicketSasa/EventBrite")
        return {"status": "success", "new_events": new_events}

    except Exception as e:
        db.rollback()
        logger.error(f"Error scraping events: {e}")
        raise e
    finally:
        db.close()