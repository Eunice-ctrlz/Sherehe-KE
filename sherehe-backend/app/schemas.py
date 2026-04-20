from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from typing import Optional, List

class DeviceBase(BaseModel):
    device_fingerprint: str
    level: Optional[str] = 'rookie'
    theme: Optional[str] = 'standard'
    profile_name: Optional[str] = None
    avatar_url: Optional[str] = None

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(BaseModel):
    profile_name: Optional[str] = None
    avatar_url: Optional[str] = None
    theme: Optional[str] = None

class DeviceResponse(DeviceBase):
    device_id: UUID4
    total_points: int
    last_pulse_at: Optional[datetime] = None
    created_at: datetime
    level: str # Explicitly expose calculated level

    class Config:
        from_attributes = True

class SquadBase(BaseModel):
    name: str

class SquadCreate(SquadBase):
    device_fingerprint: str

class SquadResponse(SquadBase):
    squad_id: UUID4
    invite_code: str
    created_at: datetime

    class Config:
        from_attributes = True

class VenueBase(BaseModel):
    name: str
    venue_type: str
    min_entry_fee: Optional[int] = None
    status: Optional[str] = 'active'

class VenueCreate(VenueBase):
    latitude: float
    longitude: float

class VenueResponse(VenueBase):
    venue_id: UUID4
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PulseBase(BaseModel):
    device_id: UUID4
    venue_id: Optional[UUID4] = None
    intensity: Optional[int] = 5

class PulseCreate(PulseBase):
    latitude: float
    longitude: float

class PulseResponse(PulseBase):
    pulse_id: UUID4
    decay_status: str
    created_at: datetime

    class Config:
        from_attributes = True
