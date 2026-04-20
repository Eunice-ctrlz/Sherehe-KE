import hashlib
from sqlalchemy.orm import Session
from app.models import Device
import uuid

def hash_device_fingerprint(device_fingerprint: str) -> str:
    """
    Deterministically hash device fingerprint to prevent reverse-engineering
    """
    salt = "sherehe_kernel_2024"
    return hashlib.sha256(f"{device_fingerprint}{salt}".encode()).hexdigest()

def calculate_device_level(total_points: int) -> str:
    """
    Calculate user's level based on points
    """
    if total_points >= 500:
        return "influencer"
    elif total_points >= 100:
        return "insider"
    return "rookie"

def get_or_create_device(device_fingerprint: str, db: Session):
    """
    Get existing device or create new anonymous device
    """
    hashed = hash_device_fingerprint(device_fingerprint)
    
    device = db.query(Device).filter(Device.device_fingerprint == hashed).first()
    
    if not device:
        device = Device(
            device_id=uuid.uuid4(),
            device_fingerprint=hashed,
            total_points=0,
            level="rookie"
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    
    return device