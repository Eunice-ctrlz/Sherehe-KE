from app.core.celery_app import celery_app
from app.database import SessionLocal
from app.models import Pulse
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def cleanup_expired_pulses():
    """Soft deletes pulses older than 4 hours."""
    db = SessionLocal()
    try:
        now = datetime.now()
        four_hours_ago = now - timedelta(hours=4)
        
        # Soft delete logic
        result = db.query(Pulse).filter(
            Pulse.decay_status != "expired",
            Pulse.created_at <= four_hours_ago
        ).update({"decay_status": "expired"})
        
        db.commit()
        logger.info(f"Marked {result} pulses as expired.")
        return {"expired": result}
    except Exception as e:
        db.rollback()
        logger.error(f"Error cleaning up pulses: {str(e)}")
        raise e
    finally:
        db.close()

@celery_app.task
def delete_device_history():
    """Hard deletes pulses older than 48 hours for privacy."""
    db = SessionLocal()
    try:
        now = datetime.now()
        forty_eight_hours_ago = now - timedelta(hours=48)
        
        deleted = db.query(Pulse).filter(
            Pulse.created_at <= forty_eight_hours_ago
        ).delete()
        
        db.commit()
        logger.info(f"Hard deleted {deleted} old pulses for privacy.")
        return {"deleted": deleted}
    except Exception as e:
        db.rollback()
        logger.error(f"Error cleaning up pulses: {str(e)}")
        raise e
    finally:
        db.close()


@celery_app.task
def recalculate_heat_clusters():
    """Recalculates heat clusters and warms up the cache for busy zones."""
    db = SessionLocal()
    from sqlalchemy import text
    try:
        logger.info("Recalculating heat clusters... (Phase 4 ST_ClusterDBSCAN)")
        
        # 1. Clear old clusters
        db.execute(text("TRUNCATE TABLE heat_clusters;"))
        
        # eps 0.002 is roughly 220 meters
        # Calculate real-time decayed intensity per point, filter out low ones or expired
        sql_query = text("""
            WITH clustered_pulses AS (
                SELECT
                    pulse_id,
                    location,
                    venue_id,
                    intensity * GREATEST(0.1, 1.0 - (EXTRACT(EPOCH FROM (now() - created_at))/3600.0) / 4.0) AS decayed_intensity,
                    ST_ClusterDBSCAN(location::geometry, eps := 0.002, minpoints := 1) OVER () AS cluster_id
                FROM pulses
                WHERE created_at >= (now() - interval '4 hours')
                  AND decay_status != 'expired'
            )
            INSERT INTO heat_clusters (cluster_id, cluster_location, total_pulses, heat_intensity, calculated_at)
            SELECT 
                gen_random_uuid(),
                ST_Centroid(ST_Collect(location::geometry))::geography AS cluster_location,
                COUNT(pulse_id) AS total_pulses,
                SUM(decayed_intensity) AS heat_intensity,
                now()
            FROM clustered_pulses
            GROUP BY cluster_id;
        """)
        
        db.execute(sql_query)
        db.commit()
        
        # Invalidate previous bounding box caches to force a fresh GET map pull
        import redis
        import os
        redis_client = redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"))
        
        try:
            for key in redis_client.scan_iter("heat:bbox:*"):
                redis_client.delete(key)
            logger.info("Successfully recalculated clusters & cleared bbox caches.")
        except Exception as redis_e:
            logger.error(f"Redis error: {redis_e}")
            
        return {"status": "success", "message": "Cluster tables refreshed"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error recalculating heat clusters: {str(e)}")
        raise e
    finally:
        db.close()
