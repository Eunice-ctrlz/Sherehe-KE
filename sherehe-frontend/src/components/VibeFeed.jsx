import React, { useState, useEffect } from 'react';
import { useStore } from '../store.js';

export default function VibeFeed({ fullScreen = false }) {
  const [vibes, setVibes] = useState([
    {
      id: 1,
      venue: 'Club Pulse',
      user: 'Raver#42',
      avatar: '👨‍🎤',
      message: 'The energy is INSANE right now! 🔥',
      intensity: 92,
      timestamp: '2 min ago',
      likes: 24,
    },
    {
      id: 2,
      venue: 'Neon Lounge',
      user: 'DJ_Vibes',
      avatar: '🎧',
      message: 'Drop incoming! Get here before 11pm',
      intensity: 78,
      timestamp: '5 min ago',
      likes: 18,
    },
    {
      id: 3,
      venue: 'Electric Bar',
      user: 'Night_Owl',
      avatar: '🦉',
      message: 'Chill vibes, great drinks, perfect crowd',
      intensity: 65,
      timestamp: '8 min ago',
      likes: 12,
    },
  ]);

  const [messageInput, setMessageInput] = useState('');
  const [showVibeFeed, setShowVibeFeed] = useState(false);

  const handleSendVibe = () => {
    if (!messageInput.trim()) return;

    const newVibe = {
      id: vibes.length + 1,
      venue: 'Your Venue',
      user: 'You',
      avatar: '😎',
      message: messageInput,
      intensity: Math.floor(Math.random() * 30) + 60,
      timestamp: 'now',
      likes: 0,
    };

    setVibes([newVibe, ...vibes]);
    setMessageInput('');
  };

  const toggleLike = (id) => {
    setVibes(
      vibes.map((v) =>
        v.id === id ? { ...v, likes: v.likes + 1 } : v
      )
    );
  };

  // Full screen page view (when on vibe-feed page)
  if (fullScreen) {
    const setCurrentPage = useStore((state) => state.setCurrentPage);
    return (
      <div className="w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-dark-700 bg-gradient-to-r from-dark-800/50 to-dark-900/50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-neon-cyan">VIBE FEED</h2>
              <p className="text-xs text-dark-500 mt-1">Real-time venue energy • All locations</p>
            </div>
            <button
              onClick={() => setCurrentPage('map')}
              className="text-dark-400 hover:text-dark-50 transition-colors text-xl"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {vibes.map((vibe) => (
            <div
              key={vibe.id}
              className="glassmorphism rounded-xl p-4 border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all"
            >
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{vibe.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold text-dark-100">{vibe.user}</div>
                      <div className="text-xs text-dark-500">{vibe.venue}</div>
                    </div>
                    <span className="text-xs text-dark-500 flex-shrink-0">{vibe.timestamp}</span>
                  </div>
                  <p className="text-sm text-dark-200 mt-2 break-words">{vibe.message}</p>

                  {/* Intensity Bar */}
                  <div className="mt-2 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-yellow"
                      style={{ width: `${vibe.intensity}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => toggleLike(vibe.id)}
                      className="text-sm text-dark-400 hover:text-neon-pink transition-colors flex items-center gap-1"
                    >
                      ❤️ {vibe.likes}
                    </button>
                    <span className="text-sm text-neon-yellow font-mono">{vibe.intensity}% vibe</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-dark-700 bg-gradient-to-r from-dark-900/50 to-dark-800/50 space-y-3 pb-20">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Share the vibe... 🎉"
            className="w-full bg-dark-900/40 border border-neon-cyan/30 rounded-lg px-4 py-2 text-dark-50 placeholder-dark-500 focus:outline-none focus:border-neon-cyan/60 transition-colors text-sm resize-none h-16"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendVibe();
              }
            }}
          />
          <button
            onClick={handleSendVibe}
            disabled={!messageInput.trim()}
            className="w-full px-4 py-2 bg-gradient-to-br from-neon-pink to-neon-red text-white rounded-lg hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Vibe 🚀
          </button>
        </div>
      </div>
    );
  }

  // Modal view (when on map page - clicking the 💬 button)
  return (
    <>
      {/* Vibe Feed Button */}
      <button
        onClick={() => setShowVibeFeed(!showVibeFeed)}
        className="fixed top-4 left-96 z-40 bg-gradient-to-br from-neon-purple to-neon-pink text-white p-3 rounded-full shadow-lg hover:shadow-neon-pink/50 transition-all duration-200 font-bold flex items-center justify-center w-12 h-12"
        title="Vibe Feed"
      >
        💬
      </button>

      {/* Vibe Feed Modal */}
      {showVibeFeed && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="glassmorphism rounded-2xl w-[90%] max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-dark-700 bg-gradient-to-r from-dark-800/50 to-dark-900/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-neon-cyan">VIBE FEED</h2>
                <p className="text-xs text-dark-500 mt-1">Real-time venue energy</p>
              </div>
              <button
                onClick={() => setShowVibeFeed(false)}
                className="text-dark-400 hover:text-dark-50 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {vibes.map((vibe) => (
                <div
                  key={vibe.id}
                  className="glassmorphism rounded-xl p-3 border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all"
                >
                  <div className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">{vibe.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-semibold text-dark-100 text-sm">{vibe.user}</div>
                          <div className="text-xs text-dark-500">{vibe.venue}</div>
                        </div>
                        <span className="text-xs text-dark-500 flex-shrink-0">{vibe.timestamp}</span>
                      </div>
                      <p className="text-sm text-dark-200 mt-2 break-words">{vibe.message}</p>

                      {/* Intensity Bar */}
                      <div className="mt-2 h-1 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-yellow"
                          style={{ width: `${vibe.intensity}%` }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => toggleLike(vibe.id)}
                          className="text-xs text-dark-400 hover:text-neon-pink transition-colors flex items-center gap-1"
                        >
                          ❤️ {vibe.likes}
                        </button>
                        <span className="text-xs text-neon-yellow font-mono">{vibe.intensity}% vibe</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-dark-700 bg-gradient-to-r from-dark-900/50 to-dark-800/50 space-y-3">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Share the vibe... 🎉"
                className="w-full bg-dark-900/40 border border-neon-cyan/30 rounded-lg px-4 py-2 text-dark-50 placeholder-dark-500 focus:outline-none focus:border-neon-cyan/60 transition-colors text-sm resize-none h-16"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSendVibe();
                  }
                }}
              />
              <button
                onClick={handleSendVibe}
                disabled={!messageInput.trim()}
                className="w-full px-4 py-2 bg-gradient-to-br from-neon-pink to-neon-red text-white rounded-lg hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Vibe 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
