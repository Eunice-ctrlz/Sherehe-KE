"""Init PostGIS models

Revision ID: 001_init_postgis_models
Revises: 
Create Date: 2026-05-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry, Geography
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_init_postgis_models'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create PostGIS extension
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')
    
    # Create devices table
    op.create_table(
        'devices',
        sa.Column('device_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_fingerprint', sa.String(length=64), nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=True),
        sa.Column('level', sa.String(), nullable=True),
        sa.Column('theme', sa.String(), nullable=True),
        sa.Column('last_pulse_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('device_id'),
        sa.UniqueConstraint('device_fingerprint')
    )
    op.create_index(op.f('ix_devices_device_fingerprint'), 'devices', ['device_fingerprint'], unique=False)
    
    # Create venues table
    op.create_table(
        'venues',
        sa.Column('venue_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('location', Geography('POINT', spatial_index=True), nullable=True),
        sa.Column('venue_type', sa.String(), nullable=True),
        sa.Column('min_entry_fee', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('venue_id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_venues_name'), 'venues', ['name'], unique=False)
    op.create_index(op.f('ix_venues_location'), 'venues', ['location'], unique=False)
    
    # Create pulses table
    op.create_table(
        'pulses',
        sa.Column('pulse_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('venue_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('location', Geography('POINT', spatial_index=True), nullable=True),
        sa.Column('intensity', sa.Float(), nullable=True),
        sa.Column('decay_status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['device_id'], ['devices.device_id'], ),
        sa.ForeignKeyConstraint(['venue_id'], ['venues.venue_id'], ),
        sa.PrimaryKeyConstraint('pulse_id')
    )
    op.create_index(op.f('ix_pulses_location'), 'pulses', ['location'], unique=False)
    op.create_index(op.f('ix_pulses_created_at'), 'pulses', ['created_at'], unique=False)
    
    # Create heat_clusters table
    op.create_table(
        'heat_clusters',
        sa.Column('cluster_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('venue_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('cluster_location', Geography('POINT', spatial_index=True), nullable=True),
        sa.Column('total_pulses', sa.Integer(), nullable=True),
        sa.Column('heat_intensity', sa.Float(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=True),
        sa.Column('calculated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['venue_id'], ['venues.venue_id'], ),
        sa.PrimaryKeyConstraint('cluster_id')
    )
    op.create_index(op.f('ix_heat_clusters_cluster_location'), 'heat_clusters', ['cluster_location'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_heat_clusters_cluster_location'), table_name='heat_clusters')
    op.drop_table('heat_clusters')
    op.drop_index(op.f('ix_pulses_created_at'), table_name='pulses')
    op.drop_index(op.f('ix_pulses_location'), table_name='pulses')
    op.drop_table('pulses')
    op.drop_index(op.f('ix_venues_location'), table_name='venues')
    op.drop_index(op.f('ix_venues_name'), table_name='venues')
    op.drop_table('venues')
    op.drop_index(op.f('ix_devices_device_fingerprint'), table_name='devices')
    op.drop_table('devices')
