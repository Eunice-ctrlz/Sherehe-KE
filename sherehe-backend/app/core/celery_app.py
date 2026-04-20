import os
from celery import Celery
from celery.schedules import crontab

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "sherehe_worker",
    broker=redis_url,
    backend=redis_url,
    include=[
        "app.workers.heat_decay_worker",
        "app.workers.scraper_worker"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Nairobi",
    enable_utc=True,
)

# Celery Beat Schedule
celery_app.conf.beat_schedule = {
    "cleanup-expired-pulses-every-5-min": {
        "task": "app.workers.heat_decay_worker.cleanup_expired_pulses",
        "schedule": crontab(minute="*/5"),
    },
    "recalculate-heat-clusters-every-60s": {
        "task": "app.workers.heat_decay_worker.recalculate_heat_clusters",
        "schedule": 60.0, # seconds
    },
    "scrape-events-daily": {
        "task": "app.workers.scraper_worker.scrape_daily_events",
        "schedule": crontab(hour=6, minute=0), # Run at 6 AM Nairobi time
    },
    "delete-device-history-daily": {
        "task": "app.workers.heat_decay_worker.delete_device_history",
        "schedule": crontab(hour=0, minute=0), # Run at midnight
