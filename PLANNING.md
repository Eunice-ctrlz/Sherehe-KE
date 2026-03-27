# Sherehe-KE (RaveCore) - Technical Planning

## 1. Core Mechanics: The "Heat" Algorithm
The app's unique value is showing *real-time* vibe check based on user activity.
- **Pulse Duration:** Pulses remain active for **3 hours** (linear decay).
    - *Example (10 PM Pulse):* By 1 AM, the pulse is fully expired.
    - *Decay Curve:* Intensity drops by 33% every hour.
- **Visuals:** 
    - **1 Pulse:** A small, fading blip.
    - **10+ Pulses:** A glowing "Hot Zone" (Level 1).
    - **50+ Pulses:** "Raging" (Brightest intensity, distinct color - Level 2).

## 2. Gamification & User Retention
To encourage accurate pulsing, users earn status and themes.
- **Pulse Points:** Users earn points for each *valid* pulse (limit 1 per hour per venue).
- **Leveling Up:** 
    - *Rookie:* 0-50 pts (Standard Theme).
    - *Insider:* 50-200 pts (Neon Theme Unlocked).
    - *Influencer:* 200+ pts (Custom Badge: "Life of the Party").
- **Badges:** 
    - "Trendsetter" (First to pulse at a location that later becomes a Hot Zone).
    - "Night Owl" (Most pulses after 2 AM).

## 3. Privacy & Authentication (Lazy Auth)
- **Phase 1 (Anonymous):** No login required to browse or Pulse.
    - *Identity:* We generate a unique **Device Fingerprint** (UUID stored in Keychain/Keystore) to track points and prevent spam.
- **Phase 2 (Login):** Required *only* for:
    - Syncing points across devices.
    - Payments/Booking tables (Future feature).
    - Recovering account.

## 4. Scalable Data Sources Strategy (Hybrid)
We will combine scraping for specific events with pure user-generated "heat".

### A. The "Gold Standard" APIs (Base Layer)
These provide reliable, structured event data.
1.  **TicketSasa / HustleSasa:** (Critical for Kenyan context). Scraping their event listings gives accurate venue, time, and price data.
2.  **Eventbrite / Mookh:** Excellent APIs for official concerts and festivals.
3.  **Google Places API:** Verify venue existence and opening hours (avoids users pulsing in invalid locations).

### B. The "Vibe Check" Sources (Social Media)
These are volatile but indicate *activity*.
1.  **Instagram Location Tags (The Holy Grail):** 
    -   *Strategy:* Monitor specific "Venues" (e.g., Alchemist, K1, Quiver) for new public stories/posts in the last hour.
    -   *Implementation:* Use a 3rd party aggregator (e.g., Apify or RapidAPI) to handle rate limits and proxy rotation. Direct scraping is brittle.
2.  **Twitter/X Streaming:** 
    -   *Listen for:* Hashtags like #NairobiNightlife, #Sherehe, or venue names.
    -   *Sentiment:* A spike in tweets about a specific club usually means something is happening.

### C.User Truth (The Pulse)
-   User pulses always override scraped data. If TicketSasa says "Event starts at 8 PM" but nobody pulses by 11 PM, the map stays dark.

## 5. API Strategy (FastAPI)
- `POST /pulse`: Receive a pulse (lat, long, device_id). Checks ratelimits & awards points.
- `GET /heat`: Returns current active pulse data (decayed).
- `GET /user/status`: Returns current points, level, and active theme.
- `WS /live`: WebSocket for pushing new pulses to the map in real-time.
