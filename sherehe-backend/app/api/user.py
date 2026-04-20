from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app import models, schemas
from app.services.device_service import get_or_create_device

router = APIRouter(
    prefix='/api/v1/users',
    tags=['Users']
)

@router.get('/profile/{device_fingerprint}', response_model=schemas.DeviceResponse)
def get_user_profile(device_fingerprint: str, db: Session = Depends(get_db)):
    """
    Get user profile and leveling stats by their unique device ID.
    If they don't exist, this creates their anonymous placeholder automatically.
    """
    device = get_or_create_device(device_fingerprint, db)
    return device


@router.put('/profile/{device_fingerprint}', response_model=schemas.DeviceResponse)
def update_user_profile(
    device_fingerprint: str,
    update_data: schemas.DeviceUpdate,
    db: Session = Depends(get_db)
):
    """
    Opt-in profile modification (gamification / avatars).
    Privacy feature: Users still don't provide emails/passwords, only cosmetic labels.
    """
    device = get_or_create_device(device_fingerprint, db)
    
    if update_data.profile_name is not None:
        # Check if username is taken by a DIFFERENT user
        existing_name = db.query(models.Device).filter(models.Device.profile_name == update_data.profile_name).first()
        if existing_name and existing_name.device_id != device.device_id:
            raise HTTPException(status_code=400, detail="Profile name already taken by another user")
        device.profile_name = update_data.profile_name

    if update_data.avatar_url is not None:
        device.avatar_url = update_data.avatar_url
        
    if update_data.theme is not None:
        device.theme = update_data.theme

    db.commit()
    db.refresh(device)
    
    return device
