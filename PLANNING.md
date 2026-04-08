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

### C. User Truth (The Pulse)
-   User pulses always override scraped data. If TicketSasa says "Event starts at 8 PM" but nobody pulses by 11 PM, the map stays dark.

### D. User-Generated Events (Host Mode)
-   **House Parties & Pop-ups:** Anyone can create an event and drop a pin on the map.
-   **Verification:** To prevent spam, user-generated events require a minimum number of "Pulses" from attendees before they become visible to the wider public as a "Hot Zone", or require the host to be a verified user (high points tier or phone/social auth).

## 5. API Strategy (FastAPI)
- `POST /events`: Create a new user-generated event (requires basic auth or device ID).
- `POST /pulse`: Receive a pulse (lat, long, device_id). Checks ratelimits & awards points.
- `GET /heat`: Returns current active pulse data (decayed).
- `GET /user/status`: Returns current points, level, and active theme.
- `WS /live`: WebSocket for pushing new pulses to the map in real-time.

## 6. Future Features & Monetization
### A. "The Door" Intel (Crowdsourced Logistics)
-   Users can add quick status tags when they "Pulse": Entry fee changes, line/queue length (e.g., "Packed", "20 Min Wait").
-   Solves the pain point of knowing if an active venue is actually accessible.

### B. Safety & Ride Integrations
-   **Deep Links:** One-tap Uber/Bolt requests directly from a venue's "Hot Zone" card to prevent typing errors when intoxicated.
-   **Squad Mode:** Users can link sessions with friends to see each other's last pulse on the map if separated.

### C. Monetization: "Promoted Heat"
-   **Verified Venues:** Club owners can claim their venue.
-   **Boosted Vibe:** Promoters can pay for a special map "Flare" (e.g., gold ring) to attract early crowds.
-   **Affiliate Ticketing:** Earn a cut when users tap "Buy Tickets" via TicketSasa/Mookh integrations.

### D. Geo-fenced "Vibe Feed" (Temporary Chat)
-   A localized chat room tied to a Hot Zone, strictly limited to users within 500 meters of the venue.
-   Messages auto-delete after 2 hours (e.g., "DJ just switched to Amapiano", "Main floor is packed").

## 7. Critical Logic & Technical Challenges (The "Gotchas")

### A. GPS Spoofing & Fraud (The Promoter Problem)
-   **Risk:** Lazy promoters will try to fake their GPS location (using apps or emulators) to artificially light up the map for their empty clubs.
-   **Logic Acknowledgment:** The backend MUST validate device fingerprints, limit the number of pulses per device/IP address in a given time frame, and strictly enforce physical proximity (e.g., you can't pulse a venue if your GPS says you are 10km away).

### B. The Cold Start Problem
-   **Risk:** If users open the app on a Thursday at 8 PM and the map is completely dark, they will assume the app is dead and delete it.
-   **Logic Acknowledgment:** The map MUST be heavily seeded with pre-scheduled events scraped from APIs (TicketSasa, Eventbrite) to provide a rich baseline experience before organic user "Pulses" take over the visuals later in the night.

### C. Spatial Clustering (PostGIS)
-   **Risk:** If 500 people pulse inside "The Alchemist", rendering 500 overlapping dots will crash the mobile browser and look terrible.
-   **Logic Acknowledgment:** The backend (PostgreSQL + PostGIS) must dynamically group nearby pulses into a single cluster object using functions like `ST_ClusterDBSCAN`, returning a single "Hot Zone" with a high intensity weight, rather than individual coordinates.

### D. Data Decay Variables
-   **Risk:** A linear 3-hour decay might not reflect reality. If a club gets shut down by police at 2 AM, it shouldn't still be glowing on the map at 4 AM.
-   **Logic Acknowledgment:** The decay algorithm cannot just rely on time. It needs external modifiers (e.g., if a massive volume of "Pulse" data suddenly flatlines, the decay curve should accelerate).

### E. WebSocket Overload (Scaling)
-   **Risk:** Broadcasting every single pulse event individually via WebSockets to every active user across the entire city will overwhelm your server.
-   **Logic Acknowledgment:** Map data must heavily rely on the bounding box (the area of the map the user is currently looking at). Users should only receive WebSocket updates for Hot Zones within their current screen bounds. Smaller, individual pulses can be sent in batched chunks every 15-30 seconds instead of instantly.

## 8. Security & Systems Architecture (Production Scale)

### A. The "Weekend Spike" (Elastic Scaling)
-   **Scalability Issue:** Nightlife apps have the most aggressive cyclical traffic of any industry. 95% of your traffic will hit between Thursday 7 PM and Sunday 6 AM. 
-   **Strategy:** You *cannot* run peak servers on a Tuesday morning. The backend (FastAPI in Docker/Kubernetes or AWS Fargate) must auto-scale rapidly at sunset and scale down at dawn to save massive cloud costs.

### B. Redis Caching Layer (The Map State)
-   **Scalability Issue:** Running a complex PostGIS geospatial query (`ST_ClusterDBSCAN`) every single time a user opens the app or pans the map will crash PostgreSQL instantly on a Friday night.
-   **Strategy:** The primary database should ONLY handle incoming `POST /pulse` data. A background worker should calculate the map's current "Heat State" every 30-60 seconds and save that JSON directly to **Redis**. When a user requests `GET /heat`, they are served the lightning-fast cached JSON from Redis, not hitting the database at all.

### C. Data Privacy & Anonymization (Zero-Trust)
-   **Security Issue:** If a hacker breaches the database, they cannot be allowed to see a historical log of exactly what clubs a specific user went to (a severe privacy violation).
-   **Strategy:** 
    -   *Never* track continuous background location.
    -   Cryptographically hash the `device_id` (e.g., salted SHA-256) so it cannot be reverse-engineered to a specific phone.
    -   Run a daily cron job that hard-deletes (or fully anonymizes) all pulse coordinate rows older than 48 hours. Only keep aggregated analytics (e.g., "The Alchemist had 4,000 pulses this month", not "User A was at The Alchemist on Friday").

### D. Rate Limiting & Bot Mitigation
-   **Security Issue:** Competitors or malicious actors writing scripts to flood the `POST /pulse` endpoint to crash the app or ruin map accuracy.
-   **Strategy:** Implement strict API Gateway rate limiting (e.g., IP throttling via Redis). If an API key or device fingerprint sends 50 pulses in 10 seconds, immediately shadow-ban that ID (accept the request with a `200 OK` so the bot doesn't know it's blocked, but silently drop the data before it hits the database).

## 9. Edge Cases & App Resilience

### A. The "Faraday Cage" (Poor Network / Offline Mode)
-   **The Problem:** Nightclubs have terrible cell reception (thick concrete walls, soundproofing, overloaded network towers).
-   **The Solution:** The app must use **Optimistic UI**. When a user hits "Pulse", the UI must instantly glow, play the haptic feedback, and award points *locally*. The actual API request should be placed in a background queue (e.g., using Service Workers or Apollo Client offline mode) that quietly retries sending the data when their phone finally reconnects to 4G out on the street.

### B. Content Moderation (User-Generated Chaos)
-   **The Problem:** With the "Host Mode" allowing anyone to drop a pin, trolls will create fake events or post inappropriate content.
-   **The Solution:** Implement a ruthless, automated self-policing system. If any user-generated event receives 3 independent "Flags / Reports" within a 1-hour window, the system automatically pulls it from the public map pending manual review.

## 10. Go-To-Market (GTM) Strategy & Compliance

### A. The "Tinder Strategy" (Hyper-Local Density)
-   **Reality Check:** If you launch "everywhere in Nairobi", the user base will be too spread out to create critical mass on the map.
-   **Strategy:** Initially geo-lock the app strictly to one dense nightlife corridor (e.g., Westlands or Kilimani) or target one major university (e.g., USIU or Strathmore). Force high density so that the people who *do* use it see an incredibly active map, then expand neighborhood by neighborhood.

### B. Legal & Compliance (Age & DPA)
-   **Data Law:** As an app collecting precise geolocation data in Kenya, you are subject to the Kenyan Data Protection Act (KDPA). You must have a clear Data Processing addendum and opt-in consent for the "Pulse" tracking.
-   **Age Gate:** Because the app inherently directs users to venues serving alcohol, the initial screen MUST have a strict 18+ (or 21+ depending on region) age verification gate. Apple/Google will reject the app from the store if a nightlife app lacks this.
