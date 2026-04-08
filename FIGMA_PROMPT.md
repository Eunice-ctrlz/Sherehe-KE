# Comprehensive Figma Design Prompt: Sherehe-KE (RaveCore)

**Target Audience for Prompt:** UI/UX Designers OR AI UI Generators (v0.dev, Galileo AI, Builder.io)
**Platform:** Mobile-First Web App / Native App (iOS/Android proportions, e.g., iPhone 14/15 Pro frame)

---

## 🎨 1. Visual Identity & Art Direction
*   **Theme:** Immersive Cyberpunk / Nightlife (Dark Mode exclusively). 
*   **Backgrounds:** True blacks (`#000000`), deep navy blues (`#0A0F1E`), and dark grays (`#121212`) for card elevations.
*   **Accent Colors (The "Heat"):** High-contrast neon to represent energy.
    *   *Hot Zone / Primary Action:* Neon Magenta (`#FF00FF` or `#E0115F`)
    *   *Low Vibe / Secondary:* Electric Cyan (`#00FFFF`)
    *   *Raging / Warning:* Neon Orange/Amber (`#FF5E00`)
    *   *Promoted (Monetization):* Glowing Gold (`#FFD700`)
*   **Typography:** Modern, geometric sans-serif (e.g., *Inter, Clash Display, or Space Grotesk*). Headings are bold and punchy; body text is highly legible.
*   **Materials:** Frosted glass effects (glassmorphism/background-blur) for overlays, bottom sheets, and floating UI to let the glowing map show through subtly.

---

## 📱 2. Core Screens & Layouts

### Screen 0: Initial Launch & City Selector (The Onboarding Gateway)
*   **The Goal:** Prevent showing an empty map of the whole country. Create a frictionless way to get them into a dense neighborhood viewport immediately.
*   **Background:** A completely blurred, dark glassmorphism overlay obscuring the map.
*   **Copy:** A bold neon headline: *"Where are we partying tonight?"*
*   **UI Components:**
    *   Sleek, glowing neon pill buttons representing the biggest nightlife cities/districts (e.g., `📍 Nairobi (Westlands)`, `📍 Mombasa`, `📍 Nakuru`).
    *   A prominent accent button: *"Use My Current Location"* (with a crosshairs/radar icon).
*   **Interaction Note:** Tapping any of these options should trigger a smooth `map.flyTo()` animation, dissolving the blur to reveal a tightly zoomed-in street-level map of the chosen neighborhood.

### Screen 1: The Live Heat Map (Home Screen)
*   **Base Map:** A dark-themed, minimalist city map (Mapbox style). Dark grays/blacks with extremely subtle street lines. No POI (Points of Interest) labels unless they are nightlife venues.
*   **Heat Visualizations (WebGL style):**
    *   *Street-Level View:* Organic, blob-like glowing zones ("Lava" blending). High-intensity areas have a hot white/orange core fading out to magenta. 
    *   *Promoted Venues:* Standard hot zones but with a distinct, pulsing Gold ring / flare around them.
    *   *User-Generated Parties:* Distinct "holographic" or pixelated pin drops that denote a pop-up rather than a permanent club.
    *   *Squad Mode:* Small, glowing avatars of friends mapped in real-time within the hot zones.
*   **Floating UI Overlays (Glassmorphism):** 
    *   *Top:* Sleek search bar, filters icon (music, distance, cover charge), and a "Host Popup" (+) button.
    *   *Bottom Center:* A massive, tactile, glowing **"PULSE" Button**. Looks inviting, with a subtle radar/fingerprint motif.
    *   *Bottom Navigation:* Minimalist icons for Map, Vibe Feeds, and Profile.

### Screen 2: Venue Detail / Hot Zone Bottom Sheet
*   *Interaction:* Slides up from the bottom when a glowing zone is tapped, covering ~60% of the screen. Glassmorphism background.
*   **Header:** Venue Name (e.g., "The Alchemist"), Distance, and Open Status.
*   **Vibe Meter:** A digital gauge showing current "Heat Level" (e.g., "85 Pulses / Raging") and a decayed timestamp ("Last verified 2m ago").
*   **"The Door" Intel (Crowdsourced Logistics):** 
    *   A prominent status pill cluster: `Cover: 1000 KES` | `Queue: Packed 🔴` (or `No Line 🟢`).
*   **Safety & Ride Integrations:** A bold "Get Me There" row featuring deep-link buttons for **Uber** and **Bolt** with price/ETA estimates.
*   **Event Info & Action:** If an official event is happening (scraped from TicketSasa), show the flyer thumbnail, music genre, and a neon "Buy Tickets" button (Affiliate link).

### Screen 3: The "Pulse" Action Flow & Door Intel
*   *Interaction:* What happens when the user taps the massive PULSE button.
*   **Optimistic UI State:** The button immediately triggers a ripple/radar shockwave animation on the map. 
*   **Quick-Intel Popup:** Instantly after pulsing, a sleek micro-overlay asks: *"What's the door like?"*
    *   Bite-sized, easily tappable buttons: `Free Entry`, `Paid`, `Packed Line`, `Walk Right In`.
*   **Reward Toast:** A small glowing notification sliding down from the top: *"+10 Pulse Points earned!"*

### Screen 4: Geo-fenced "Vibe Feed" (Localized Chat)
*   *Access:* Tapped from the Venue Bottom Sheet.
*   **Environment:** A chat room strictly for users within 500m of the venue.
*   **UI Layout:** Looks like a live stream chat (e.g., Twitch or TikTok live chat). Dark, semi-transparent background.
*   **Messages:** Highlighted with bright usernames. E.g., *"DJ just switched to Amapiano!"*, or *"Main floor is packed, go upstairs."*
*   **Context:** A subtle banner at the top reminding users: *"Messages disappear after 2 hours."*

### Screen 5: "Host Mode" (Create a Pop-up)
*   *Interaction:* Opened from the Top UI (+) button.
*   **Form:** A sleek, step-by-step modal.
*   **Inputs:** 
    1. "Drop the Pin" (Map crosshairs).
    2. "Party Name" (e.g., "Runda House Party").
    3. "Vibe/Genre".
*   **Warning/Spam Prevention Text:** A glowing warning: *"This pin will only become public once 3 other devices Pulse here."*

### Screen 6: Gamification Profile ("Rave Status")
*   **Header:** User Avatar (holographic/neon framing) and current Tier level (Rookie, Insider, Influencer).
*   **Stats Dashboard:** Total Pulse Points, progress bar to the next tier unlock.
*   **Badges Grid:** 3D, metallic/neon badges that the user has unlocked:
    *   *Trendsetter Badge* (Flame icon).
    *   *Night Owl Badge* (Moon/Owl icon).
*   **Theme Shift:** Background accents dynamically match the user's unlocked tier color (e.g., Magenta for Influencers).

---

## 🌀 3. Interactions & Micro-Animations (Prototyping Notes)
*   **Lava Blending:** In Figma, simulate Mapbox's organic heat blending by using blurred ellipses with `Lighten` or `Screen` blend modes where they overlap.
*   **Zoom Behavior:** When zooming out in the prototype, transition from wide overlapping blobs to single, high-intensity hex-bins or aggregated dots.
*   **Haptics:** Visually imply haptic feedback on the "Pulse" button by adding an immediate "pressed" state (scaling down 95%) followed by the expanding shockwave.
