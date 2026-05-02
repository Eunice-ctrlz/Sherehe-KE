import React, { useEffect, useState } from 'react';
import { useStore } from '../store.js';
import { apiService } from '../api.js';
import { getUserLocation, hapticFeedback, formatTimeRemaining } from '../utils.js';

export default function PulseButton() {
  const [timeLeft, setTimeLeft] = useState(0);
  const deviceId = useStore((state) => state.deviceId);
  const isPulsing = useStore((state) => state.isPulsing);
  const nextPulseAvailable = useStore((state) => state.nextPulseAvailable);
  const setIsPulsing = useStore((state) => state.setIsPulsing);
  const handleSuccessfulPulse = useStore((state) => state.handleSuccessfulPulse);
  const setNotification = useStore((state) => state.setNotification);

  useEffect(() => {
    if (!nextPulseAvailable) return;
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((nextPulseAvailable - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [nextPulseAvailable]);

  const canPulse = timeLeft <= 0 && !isPulsing;

  const handlePulse = async () => {
    if (!canPulse) {
      hapticFeedback('error');
      return;
    }

    try {
      setIsPulsing(true);
      const loc = await getUserLocation();
      hapticFeedback('success');
      
      const res = await apiService.createPulse(loc.latitude, loc.longitude, deviceId, 'Unknown Location');
      handleSuccessfulPulse(res.expires_in_seconds || 10800);
      setNotification('Pulsed! Next in 3h', 'success');

      // Trigger door intel popup
      const setShowDoorIntel = useStore.getState().setShowDoorIntel;
      setTimeout(() => {
        setShowDoorIntel(true);
      }, 500);

    } catch (err) {
      console.error(err);
      hapticFeedback('error');
      setNotification('Rate limited or Network Error', 'error');
      setIsPulsing(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Radar pulse rings */}
      {canPulse && (
        <>
          <div 
            className="absolute inset-0 rounded-full border-2 border-neon-pink/40"
            style={{
              animation: 'radarPulse 2s ease-out infinite',
              width: '112px',
              height: '112px',
              left: '-28px',
              top: '-28px',
            }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-neon-pink/20"
            style={{
              animation: 'radarPulse2 2s ease-out infinite 0.6s',
              width: '112px',
              height: '112px',
              left: '-28px',
              top: '-28px',
            }}
          />
        </>
      )}
      <button
        onClick={handlePulse}
        disabled={!canPulse}
        className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center font-bold text-lg shadow-2xl transition-all duration-300 pointer-events-auto border-2 ${
          canPulse 
            ? 'bg-gradient-to-br from-neon-pink via-neon-red to-neon-purple text-white hover:scale-110 active:scale-95 cursor-pointer border-neon-pink' 
            : 'bg-dark-700 text-dark-400 cursor-not-allowed border-dark-600'
        }`}
        style={canPulse ? { animation: 'pulseGlow 2s ease-in-out infinite' } : {}}
      >
        <span className="z-10 text-center">{isPulsing ? '🔴' : '⚡'}</span>
        <span className="z-10 text-sm mt-1">{isPulsing ? 'Pulsing' : 'PULSE'}</span>
        {!canPulse && !isPulsing && (
          <span className="text-xs font-mono mt-2 opacity-70">{formatTimeRemaining(timeLeft)}</span>
        )}
      </button>
    </div>
  );
}
