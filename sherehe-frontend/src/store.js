import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getOrCreateDeviceId } from './utils';

export const useStore = create(
  persist(
    (set, get) => ({
      // UI State
      isLoading: false,
      error: null,
      notification: null,

      // Map State (Defaults to Nairobi bounds)
      mapBounds: {
        ne_lat: -1.28,
        ne_lng: 36.82,
        sw_lat: -1.29,
        sw_lng: 36.81,
      },

      // Data State
      pulses: [],
      lastPulseTime: null,
      nextPulseAvailable: null,
      isPulsing: false,

      // User State
      deviceId: getOrCreateDeviceId(),
      userLocation: null,

      // Navigation State
      currentPage: 'map', // 'map' | 'vibe-feed' | 'profile'
      showHostMode: false,
      showDoorIntel: false,

      // User Profile State
      userProfile: {
        tier: 'Rookie', // 'Rookie' | 'Insider' | 'Influencer'
        totalPoints: 342,
        pointsToNextTier: 658,
        badges: [
          { id: 'trendsetter', name: 'Trendsetter', icon: '🔥', unlocked: true },
          { id: 'night_owl', name: 'Night Owl', icon: '🦉', unlocked: true },
          { id: 'early_bird', name: 'Early Bird', icon: '🌅', unlocked: false },
          { id: 'legend', name: 'Legend', icon: '👑', unlocked: false },
          { id: 'explorer', name: 'Explorer', icon: '🗺️', unlocked: true },
          { id: 'connector', name: 'Connector', icon: '🤝', unlocked: false },
        ],
      },

      // Actions
      setLoading: (bool) => set({ isLoading: bool }),
      setError: (err) => set({ error: err }),
      
      setNotification: (msg, type = 'info') => {
        set({ notification: { message: msg, type } });
        // Auto dismiss after 4 seconds
        setTimeout(() => set({ notification: null }), 4000);
      },
      
      setMapBounds: (bounds) => set({ mapBounds: bounds }),
      setPulses: (pulses) => set({ pulses }),
      setUserLocation: (loc) => set({ userLocation: loc }),
      setIsPulsing: (bool) => set({ isPulsing: bool }),
      
      // Handles the 1-hour rate limit persistence
      handleSuccessfulPulse: (expiresInSeconds) => {
        const now = new Date().getTime();
        const availableAt = now + (expiresInSeconds * 1000);
        set({ 
          lastPulseTime: now,
          nextPulseAvailable: availableAt,
          isPulsing: false 
        });
      },

      // Navigation Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setShowHostMode: (bool) => set({ showHostMode: bool }),
      setShowDoorIntel: (bool) => set({ showDoorIntel: bool }),

      // Profile Actions
      addPulsePoints: (points) => {
        const { userProfile } = get();
        const newPoints = userProfile.totalPoints + points;
        const newPointsToNextTier = Math.max(0, userProfile.pointsToNextTier - points);
        
        // Check tier progression
        let tier = userProfile.tier;
        if (newPointsToNextTier <= 0 && tier === 'Rookie') {
          tier = 'Insider';
        } else if (newPointsToNextTier <= 0 && tier === 'Insider') {
          tier = 'Influencer';
        }

        set({
          userProfile: {
            ...userProfile,
            totalPoints: newPoints,
            pointsToNextTier: Math.max(0, newPointsToNextTier),
            tier,
          },
        });
      },

      unlockBadge: (badgeId) => {
        const { userProfile } = get();
        set({
          userProfile: {
            ...userProfile,
            badges: userProfile.badges.map((b) =>
              b.id === badgeId ? { ...b, unlocked: true } : b
            ),
          },
        });
      },
    }),
    {
      name: 'sherehe-store', // This key saves in LocalStorage
      partialize: (state) => ({ 
        deviceId: state.deviceId, 
        lastPulseTime: state.lastPulseTime,
        nextPulseAvailable: state.nextPulseAvailable
      }), // Only save these persistent settings!
    }
  )
);
