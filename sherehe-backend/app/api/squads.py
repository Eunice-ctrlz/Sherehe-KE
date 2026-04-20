from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast
from geoalchemy2 import Geometry
from app.database import get_db
from app import models, schemas
from app.services.device_service import get_or_create_device
import string
import random
from geoalchemy2.functions import ST_X, ST_Y

router = APIRouter(prefix="/api/v1/squads", tags=["squads"])

def generate_invite_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("", response_model=schemas.SquadResponse)
def create_squad(squad_data: schemas.SquadCreate, db: Session = Depends(get_db)):
    """
    Create a new squad for friends to share their live vibes.
    Generates a unique 6-character invite code.
    """
    device = get_or_create_device(squad_data.device_fingerprint, db)
    
    code = generate_invite_code()
    # Simple uniqueness check
    while db.query(models.Squad).filter(models.Squad.invite_code == code).first():
        code = generate_invite_code()
        
    new_squad = models.Squad(
        name=squad_data.name,
        invite_code=code,
        created_by=device.device_id
    )
    db.add(new_squad)
    db.commit()
    db.refresh(new_squad)
    
    # Auto-join the creator
    squad_member = models.SquadMember(
        squad_id=new_squad.squad_id,
        device_id=device.device_id
    )
    db.add(squad_member)
    db.commit()
    
    return new_squad

@router.post("/{invite_code}/join")
def join_squad(invite_code: str, device_fingerprint: str, db: Session = Depends(get_db)):
    """
    Join an existing squad using a 6-character code.
    """
    code = invite_code.upper()
    squad = db.query(models.Squad).filter(models.Squad.invite_code == code).first()
    if not squad:
        raise HTTPException(status_code=404, detail="Invalid invite code")
        
    device = get_or_create_device(device_fingerprint, db)
    
    # Check if already joined
    existing_member = db.query(models.SquadMember).filter(
        models.SquadMember.squad_id == squad.squad_id,
        models.SquadMember.device_id == device.device_id
    ).first()
    
    if existing_member:
        return {"status": "success", "message": "Already a member of this squad", "squad_name": squad.name}
        
    new_member = models.SquadMember(
        squad_id=squad.squad_id,
        device_id=device.device_id
    )
    db.add(new_member)
    db.commit()
    
    return {"status": "success", "message": f"Successfully joined {squad.name}", "squad_name": squad.name}

@router.get("/{squad_id}/vibes")
def get_squad_vibes(squad_id: str, db: Session = Depends(get_db)):
    """
    Get the latest vibes (pulses) from the squad members.
    Phase 7: Allows friends to see exactly where their squad is on the map right now.
    """
    # Find all squad member device IDs
    members = db.query(models.SquadMember.device_id).filter(models.SquadMember.squad_id == squad_id).subquery()
    
    # Find their latest active pulses
    results = db.query(
        models.Pulse.pulse_id,
        models.Pulse.intensity,
        models.Pulse.created_at,
        models.Device.profile_name,
        models.Device.avatar_url,
        ST_X(cast(models.Pulse.location, Geometry)).label('lng'),
        ST_Y(cast(models.Pulse.location, Geometry)).label('lat'),
        models.Venue.name.label('venue_name')
    ).join(
        models.Device, models.Pulse.device_id == models.Device.device_id
    ).outerjoin(
        models.Venue, models.Pulse.venue_id == models.Venue.venue_id
    ).filter(
        models.Pulse.device_id.in_(members),
        models.Pulse.decay_status != 'expired'
    ).all()
    
    vibes = []
    for r in results:
        vibes.append({
            "pulse_id": str(r.pulse_id),
            "profile_name": r.profile_name or "Anonymous Raver",
            "avatar_url": r.avatar_url,
            "venue": r.venue_name,
            "coordinates": [r.lng, r.lat],
            "intensity": r.intensity,
            "created_at": r.created_at.isoformat()
        })
        
    return {"squad_id": squad_id, "vibes": vibes}