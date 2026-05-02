import React, { useState } from 'react';
import { useStore } from '../store.js';

export default function SearchVenues() {
  const [searchQuery, setSearchQuery] = useState('');
  const setShowHostMode = useStore((state) => state.setShowHostMode);

  return (
    <>
      {/* Top Search Bar */}
      <div className="absolute top-4 right-4 z-40 w-80 pointer-events-auto">
        <div className="glassmorphism rounded-2xl p-4 shadow-2xl flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900/40 border border-neon-cyan/30 rounded-lg px-4 py-2 text-dark-50 placeholder-dark-500 focus:outline-none focus:border-neon-cyan/60 transition-colors text-sm"
            />
            <span className="absolute right-3 top-2.5 text-dark-500">🔍</span>
          </div>
          <button
            onClick={() => setShowHostMode(true)}
            className="bg-gradient-to-br from-neon-pink to-neon-red text-white p-2 rounded-lg hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-200 flex items-center justify-center font-bold"
            title="Host a pop-up"
          >
            +
          </button>
        </div>
      </div>
    </>
  );
}
