import React from 'react';
import { useStore } from '../store.js';

export default function DoorIntel() {
  const setShowDoorIntel = useStore((state) => state.setShowDoorIntel);
  const addPulsePoints = useStore((state) => state.addPulsePoints);
  const setNotification = useStore((state) => state.setNotification);

  const doorOptions = [
    { id: 'free', label: 'Free Entry', emoji: '✨', color: 'from-neon-cyan to-neon-blue' },
    { id: 'paid', label: 'Paid Entry', emoji: '💳', color: 'from-neon-yellow to-neon-orange' },
    { id: 'packed', label: 'Packed Line', emoji: '🔴', color: 'from-neon-red to-neon-pink' },
    { id: 'walk', label: 'Walk Right In', emoji: '🟢', color: 'from-green-400 to-neon-cyan' },
  ];

  const handleDoorIntel = (option) => {
    // Add 10 pulse points for sharing intel
    addPulsePoints(10);
    
    setNotification(`💫 +10 Pulse Points! Marked "${option.label}"`, 'success');
    
    // Close modal after a brief delay to show the reward
    setTimeout(() => {
      setShowDoorIntel(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
      <div className="glassmorphism rounded-2xl w-[90%] max-w-md p-6 relative shadow-2xl border border-neon-cyan/30 animate-pulse-slow">
        <button
          onClick={() => setShowDoorIntel(false)}
          className="absolute top-4 right-4 text-dark-400 hover:text-dark-50 transition-colors text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neon-cyan mb-1">What's the Door Like?</h2>
          <p className="text-xs text-dark-500">Help others find the vibe. Earn 10 Pulse Points!</p>
        </div>

        {/* Radar Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            {/* Outer pulse ring */}
            <div
              className="absolute inset-0 rounded-full border-2 border-neon-pink/40"
              style={{
                animation: 'radarPulse 2s ease-out infinite',
              }}
            />
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-neon-pink" />
            </div>
          </div>
        </div>

        {/* Door Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {doorOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleDoorIntel(option)}
              className={`group relative overflow-hidden rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-br ${option.color} hover:shadow-lg`}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-dark-900/40 group-hover:bg-dark-900/20 transition-all" />

              <div className="relative z-10">
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="font-bold text-sm text-white">{option.label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-dark-900/50 border border-dark-700 rounded-lg p-3 text-center">
          <p className="text-xs text-dark-400">
            Your feedback helps the community stay in the loop
          </p>
        </div>
      </div>
    </div>
  );
}
