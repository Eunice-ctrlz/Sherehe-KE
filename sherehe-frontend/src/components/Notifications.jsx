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

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-300 pointer-events-none transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div 
        className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-md font-medium text-sm ${
          isError 
            ? 'bg-red-500/20 border-red-500/50 text-red-200' 
            : 'bg-green-500/20 border-green-500/50 text-green-200'
        }`}
      >
        {notification.message}
      </div>
    </div>
  );
}
