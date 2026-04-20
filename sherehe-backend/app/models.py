from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID, JSON
from geoalchemy2 import Geography, Geometry
from datetime import datetime
import uuid
from app.database import Base

class Device(Base):
    __tablename__ = "devices"
    
    device_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_fingerprint = Column(String(64), unique=True, index=True)  # SHA256(IMEI + User Agent)
    profile_name = Column(String(50), unique=True, nullable=True)  # Phase 6: Optional username
    avatar_url = Column(String(255), nullable=True)  # Phase 6: Avatar
    total_points = Column(Integer, default=0)
    level = Column(String, default="rookie")  # rookie, insider, influencer
    theme = Column(String, default="standard")
    last_pulse_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

class Venue(Base):
    __tablename__ = "venues"
    
    venue_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, index=True)
    location = Column(Geography('POINT'), index=True)  # PostGIS Geography point
    venue_type = Column(String)  # club, bar, event_space
    min_entry_fee = Column(Integer, nullable=True)
    status = Column(String, default="active")
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

class Pulse(Base):
    __tablename__ = "pulses"
    
    pulse_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.device_id"))
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.venue_id"), nullable=True)
    location = Column(Geography('POINT'), index=True)
    intensity = Column(Float, default=1.0)  # Starts at 1.0, decays over time
    decay_status = Column(String, default="active")  # active, fading, expired
    created_at = Column(DateTime, default=datetime.now, index=True)

class HeatCluster(Base):
    __tablename__ = "heat_clusters"
    
    cluster_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.venue_id"), nullable=True)
    cluster_location = Column(Geography('POINT'), index=True)
    total_pulses = Column(Integer, default=0)
    heat_intensity = Column(Float, default=0.0)  # 0.0 - 1.0
    last_updated = Column(DateTime, default=datetime.now)
    calculated_at = Column(DateTime, default=datetime.now)


class Event(Base):
    __tablename__ = "events"
    
    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.venue_id"))
    event_name = Column(String)
    event_type = Column(String)  # dj, live_band, promotion
    event_start = Column(DateTime, index=True)
    event_end = Column(DateTime)
    data_source = Column(String)  # ticketsasa, eventbrite, user
    created_at = Column(DateTime, default=datetime.now)

class Squad(Base):
    __tablename__ = "squads"
    
    squad_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(8), unique=True, index=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("devices.device_id"))
    created_at = Column(DateTime, default=datetime.now)

class SquadMember(Base):
    __tablename__ = "squad_members"
    
    squad_id = Column(UUID(as_uuid=True), ForeignKey("squads.squad_id"), primary_key=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.device_id"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.now)