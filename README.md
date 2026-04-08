# Sherehe-KE (RaveCore)

## Project Overview
A real-time nightlife discovery app that helps users find active parties ("vibes") without compromising privacy or battery life.

## Core Problem
Finding active parties in real-time is difficult.
- **Existing solutions:** Rely on static event listings (which might be empty) or invasive background tracking (Snap Map) which drains battery and invades privacy.

## Solution: Hybrid Heat Map
1.  **Baseline Data:** Public Event APIs & Social Media Scraping (Scheduled events).
2.  **User-Generated Events:** Anyone can drop a pin and host their own party or pop-up event on the map.
3.  **Real-Time "Vibe" Validation:** User-initiated "Pulse" button.
    -   Users confirm a party is active by "pulsing".
    -   More pulses = Brighter/Hotter glow on the map.
    -   **Privacy/Battery:** No continuous background GPS. Location is only sent when "Pulse" is tapped.

## Tech Stack
-   **Frontend:** React (Vite), Tailwind CSS, Mapbox GL JS
-   **Backend:** FastAPI (Python)
-   **Database:** PostgreSQL + PostGIS (Geospatial data queries)
-   **Real-time:** WebSockets (for live pulse updates)

## Visual Identity
-   **Theme:** Dark Mode / Nightlife (Deep Blue/Black background).
-   **Accents:** Neon Magenta/Cyan (Cyberpunk aesthetic).
