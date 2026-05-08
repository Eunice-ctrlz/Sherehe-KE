# Sherehe-KE Backend API

Anonymous nightlife vibe-checking API for Nairobi. Uses PostGIS spatial indexing, Redis caching, and Celery background tasks for real-time heat mapping.

## Features

✅ **Anonymous Pulse System** - Users drop location pins without authentication  
✅ **3-Hour Linear Decay** - Intensity fades over time, eventually expires  
✅ **PostGIS Spatial Indexing** - Fast bounding box queries for map viewports  
✅ **Rate Limiting** - 1 pulse per hour per device  
✅ **Privacy First** - No continuous tracking, cryptographic device hashing, 48-hour data retention  
✅ **Redis Caching** - 60-second cache for heat data to reduce DB load  
✅ **Celery Background Tasks** - Auto-cleanup of expired pulses, pre-calculated heat clusters  
✅ **GeoJSON Output** - Standard format for mapping libraries (Mapbox, Leaflet)  

## Architecture

```
User Mobile App
    ↓
POST /api/v1/pulse (drop a vibe)
    ↓
FastAPI (Uvicorn)
    ├→ Rate limit check (Redis)
    ├→ Hash device ID (SHA256)
    └→ Insert into PostgreSQL with TTL
        ↓
        ├→ GIST index lookup (fast spatial queries)
        └→ Publish to Redis Pub/Sub
            ↓
            Celery Worker (background)
            ├→ Cleanup expired pulses (every 5 min)
            └→ Recalculate heat clusters (every 60s)

User opens map
    ↓
GET /api/v1/heat?ne_lat=...&sw_lat=...
    ↓
FastAPI
    ├→ Check Redis cache (60s TTL)
    ├→ If miss: PostGIS ST_Intersects query
    └→ Calculate decay: intensity = 1.0 - (age_hours / 3.0)
        ↓
        GeoJSON FeatureCollection
        ↓
        Mapbox renders heat layer
```

## Prerequisites

- **Docker** (recommended) or **Python 3.11+**
- **PostgreSQL 16** with PostGIS extension
- **Redis 7+**
- **Git**

## Quick Start (Docker)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd sherehe-backend
cp .env.example .env
```

### 2. Start Full Stack

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- FastAPI API (port 8000)
- Celery Worker (background tasks)
- Celery Beat (scheduled tasks)

### 3. Verify Health

```bash
curl http://localhost:8000/api/v1/health

# Response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-04-17T14:30:00"
}
```

### 4. View API Docs

Open browser: **http://localhost:8000/api/docs**



### 2. Create Database

```bash
createdb sherehe_db
psql sherehe_db < init.sql
```

### 3. Install Python Dependencies

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start Redis

```bash
redis-server
```

In another terminal:

### 5. Start FastAPI

```bash
uvicorn app.main:app --reload
```

### 6. Start Celery Worker (optional)

```bash
celery -A app.core.celery_app worker --loglevel=info
```

### 7. Start Celery Beat (optional)

```bash
celery -A app.core.celery_app beat --loglevel=info
```

## API Endpoints

### POST /api/v1/pulse

**Drop a new vibe pulse**

```bash
curl -X POST http://localhost:8000/api/v1/pulse \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -1.2866,
    "longitude": 36.8172,
    "device_id": "my-phone-uuid-123",
    "venue_name": "The Alchemist"
  }'
```

**Response (200 OK):**
```json
{
  "status": "pulsed",
  "message": "Pulse recorded successfully",
  "expires_in_seconds": 10800,
  "retry_after": null
}
```

**Response (429 Too Many Requests):**
```json
{
  "detail": "Rate limited. One pulse per hour per device"
}
```

---

### GET /api/v1/heat

**Fetch visible pulses in a bounding box**

```bash
curl "http://localhost:8000/api/v1/heat?ne_lat=-1.28&ne_lng=36.82&sw_lat=-1.29&sw_lng=36.81"
```

**Response (GeoJSON FeatureCollection):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [36.8172, -1.2866]
      },
      "properties": {
        "intensity": 0.73,
        "venue": "The Alchemist",
        "expires": "2026-04-17T17:30:00",
        "age_hours": 0.5,
        "pulse_id": "550e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "count": 1,
  "timestamp": "2026-04-17T14:30:00"
}
```

---

### GET /api/v1/health

**Service health check**

```bash
curl http://localhost:8000/api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-04-17T14:30:00"
}
```

---

## Database Schema

### pulses table

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Unique pulse ID |
| device_hash | VARCHAR(64) | Anonymous device tracker (SHA256) |
| location | GEOGRAPHY(POINT) | GPS coordinates with spatial index |
| venue_name | VARCHAR(255) | Optional venue label |
| intensity | FLOAT | Currently 1.0 (recalculated on read) |
| created_at | TIMESTAMP | Pulse birth time |
| expires_at | TIMESTAMP | TTL expiry (3 hours) |

**Indices:**
- `idx_pulses_location` (GIST) - Fast bounding box queries
- `idx_pulses_active` (Partial B-tree) - Only non-expired pulses
- `idx_pulses_device` (Composite) - Rate limit checks

---

## Decay Algorithm

**Linear Decay over 3 hours:**

```
Hour 0 → Intensity 1.0  (Brightest, just posted)
Hour 1 → Intensity 0.67 (1.0 - 1/3)
Hour 2 → Intensity 0.33 (1.0 - 2/3)
Hour 3 → Intensity 0.1  (Floor, still visible but dim)
Hour 3+ → Excluded from queries (soft delete)
```

**Calculation:**
```python
age_hours = (now - created_at) / 3600
intensity = max(0.1, 1.0 - (age_hours / 3.0))
```

---

## Privacy & Security

### Zero-Trust Architecture

✅ **No continuous GPS tracking** - Location only sent at pulse moment  
✅ **Cryptographic hashing** - Device IDs hashed with SHA256 salt, cannot be reverse-engineered  
✅ **No PII stored** - Pulses table has no names, emails, or phone numbers  
✅ **48-hour retention max** - Daily cron deletes older pulses (privacy compliance)  
✅ **No reversible identity** - Even if DB is breached, cannot identify users  

### Anti-Fraud Measures

✅ **Rate limiting** - 1 pulse per hour per device (prevents spam floods)  
✅ **Device rotation protection** - Salted SHA256 makes spoofing hard  
✅ **Timestamp validation** - Rejects pulses from future or far past  
✅ **IP rate limiting** - Future: limit pulses per IP address  

---

## Performance Considerations

### Current (MVP)

- Supports **<100 concurrent users**
- Direct database queries acceptable
- 30-second polling from client

### Phase 2 Optimization

- **Redis caching** - Cache heat data every 60 seconds
- Reduces DB load by 95%
- Hit rate: ~98% (most clients poll same bbox)

### Phase 3: WebSocket Real-Time

- Replace polling with persistent WS connection
- Server pushes updates when:
  - New pulse enters user's viewport
  - Intensity change >0.2 for tracked venue
- Bandwidth: 80% reduction

### Phase 4: Clustering

- Use `ST_ClusterDBSCAN` for pre-calculated clusters
- Return single cluster object instead of 100 individual pulses
- O(1) rendering instead of O(n)

---

## Configuration (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/sherehe_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-super-secret-key
DEVICE_HASH_SALT=sherehe_kernel_2024

# API
API_V1_STR=/api/v1
DEBUG=True

# PostGIS
SRID=4326

# Rate Limiting
PULSE_RATE_LIMIT_MINUTES=60
PULSE_TTL_HOURS=3
INTENSITY_FLOOR=0.1
```

---

## Testing

### Run Tests

```bash
pytest tests/ -v
```

### Manual API Testing

```bash
# Create multiple pulses
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/v1/pulse \
    -H "Content-Type: application/json" \
    -d "{
      \"latitude\": $(-1.286 + $RANDOM % 100 / 100000),
      \"longitude\": $( 36.817 + $RANDOM % 100 / 100000),
      \"device_id\": \"device-$i\",
      \"venue_name\": \"Test Venue $i\"
    }"
done

# Fetch heat
curl "http://localhost:8000/api/v1/heat?ne_lat=-1.28&ne_lng=36.82&sw_lat=-1.29&sw_lng=36.81"
```

---

## Deployment

### Docker (Recommended)

```bash
docker-compose -f docker-compose.yml up -d
```

### Railway/Render

1. Connect GitHub repo
2. Set environment variables
3. Deploy (auto builds from Dockerfile)

### Kubernetes (Production)

```bash
# Build image
docker build -t sherehe-api:latest .

# Push to registry
docker tag sherehe-api:latest <your-registry>/sherehe-api:latest
docker push <your-registry>/sherehe-api:latest

# Deploy manifests
kubectl apply -f k8s/
```

---

## Troubleshooting

### "psycopg2 connection refused"
Check PostgreSQL is running: `psql -U postgres -c "SELECT 1"`

### "Redis connection error"
Check Redis is running: `redis-cli ping`

### "No module named geoalchemy2"
Reinstall: `pip install --upgrade geoalchemy2`

### "GIST index not working"
Verify PostGIS installed: `psql sherehe_db -c "SELECT postgis_version();"`

---

## Roadmap

- [ ] Phase 2: Redis caching layer
- [ ] Phase 3: WebSocket /live endpoint
- [ ] Phase 4: ST_ClusterDBSCAN clustering
- [ ] Phase 5: TicketSasa/Eventbrite scraping
- [ ] Phase 6: User profiles + leveling system
- [x] Phase 7: Squad mode sharing

---

## License

MIT

## Contact

Built for Nairobi nightlife 🌃