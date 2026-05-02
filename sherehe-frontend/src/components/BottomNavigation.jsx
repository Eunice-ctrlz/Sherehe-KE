import React from 'react';
import { useStore } from '../store.js';

export default function BottomNavigation() {
  const currentPage = useStore((state) => state.currentPage);
  const setCurrentPage = useStore((state) => state.setCurrentPage);

  const navItems = [
    { id: 'map', icon: '🗺️', label: 'Map', color: 'neon-cyan' },
    { id: 'vibe-feed', icon: '💬', label: 'Vibes', color: 'neon-pink' },
    { id: 'profile', icon: '👤', label: 'Profile', color: 'neon-yellow' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto">
      <div className="glassmorphism mx-4 mb-4 rounded-2xl border border-dark-600">
        <nav className="flex justify-around items-center py-3 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 ${
                currentPage === item.id
                  ? `bg-gradient-to-br from-${item.color} to-${item.color} bg-opacity-20 border border-${item.color}/50 shadow-lg`
                  : 'hover:bg-dark-700/50'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className={`text-xs font-semibold ${currentPage === item.id ? `text-${item.color}` : 'text-dark-400'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
