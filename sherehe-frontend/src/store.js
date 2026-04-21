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
