import React, { useEffect, useState } from 'react';
import { useStore } from '../store.js';

export default function Notifications() {
  const notification = useStore((state) => state.notification);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3800);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!notification) return null;

  const isError = notification.type === 'error';
  const isSuccess = notification.type === 'success';

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-300 pointer-events-none transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div 
        className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md font-medium text-sm flex items-center gap-3 ${
          isError 
            ? 'bg-red-500/15 border-red-500/40 text-red-200' 
            : isSuccess
            ? 'bg-green-500/15 border-green-500/40 text-green-200'
            : 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan'
        }`}
        style={isSuccess ? { animation: 'neonGlow 2s ease-in-out' } : {}}
      >
        <span className="text-lg">
          {isError ? '❌' : isSuccess ? '✅' : 'ℹ️'}
        </span>
        <span>{notification.message}</span>
      </div>
    </div>
  );
}
