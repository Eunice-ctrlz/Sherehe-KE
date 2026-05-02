import React from 'react';
import { useStore } from '../store.js';

export default function ProfileScreen() {
  const userProfile = useStore((state) => state.userProfile);
  const setCurrentPage = useStore((state) => state.setCurrentPage);

  const tierColors = {
    'Rookie': { bg: 'from-neon-blue to-neon-cyan', light: 'text-neon-blue' },
    'Insider': { bg: 'from-neon-pink to-neon-purple', light: 'text-neon-pink' },
    'Influencer': { bg: 'from-yellow-400 to-neon-yellow', light: 'text-neon-yellow' },
  };

  const tierBg = tierColors[userProfile.tier];

  return (
    <div className="w-full h-full overflow-y-auto bg-dark-900 pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-b ${tierBg.bg} text-white p-6`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-4xl border-4 border-white/30">
            😎
          </div>
          <div>
            <h1 className="text-3xl font-bold">You</h1>
            <p className="text-lg opacity-90">{userProfile.tier}</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-6 space-y-6">
        {/* Pulse Points & Tier Progress */}
        <div className="glassmorphism rounded-2xl p-6 space-y-4 border border-neon-cyan/30">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-neon-cyan">Pulse Points</h2>
            <span className="text-3xl font-bold text-neon-yellow">{userProfile.totalPoints}</span>
          </div>

          {/* Progress to next tier */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-dark-400">Progress to {userProfile.tier === 'Influencer' ? 'Legend' : 'next tier'}</span>
              <span className="text-sm font-mono text-neon-pink">{userProfile.pointsToNextTier} pts</span>
            </div>
            <div className="h-3 bg-dark-700 rounded-full overflow-hidden border border-dark-600">
              <div
                className={`h-full bg-gradient-to-r ${tierBg.bg} transition-all duration-500`}
                style={{
                  width: `${Math.min(100, ((1000 - userProfile.pointsToNextTier) / 1000) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="text-xs text-dark-500 text-center">
            {userProfile.pointsToNextTier === 0 ? '🎉 Ready to level up!' : `${userProfile.pointsToNextTier} points until next tier`}
          </div>
        </div>

        {/* Badges Grid */}
        <div>
          <h2 className="text-xl font-bold text-neon-pink mb-4">Achievements</h2>
          <div className="grid grid-cols-3 gap-3">
            {userProfile.badges.map((badge) => (
              <div
                key={badge.id}
                className={`glassmorphism rounded-xl p-4 flex flex-col items-center justify-center aspect-square border ${
                  badge.unlocked
                    ? 'border-neon-pink/60 bg-neon-pink/5 hover:bg-neon-pink/10'
                    : 'border-dark-600/40 opacity-40'
                } transition-all hover:scale-105 cursor-pointer`}
              >
                <span className="text-3xl mb-2">{badge.icon}</span>
                <span className="text-xs font-semibold text-center text-dark-200 leading-tight">
                  {badge.name}
                </span>
                {!badge.unlocked && <span className="text-xs text-dark-500 mt-1">🔒</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glassmorphism rounded-xl p-4 border border-neon-cyan/20">
            <div className="text-xs text-dark-400 mb-1">Venues Pulsed</div>
            <div className="text-2xl font-bold text-neon-cyan">24</div>
          </div>
          <div className="glassmorphism rounded-xl p-4 border border-neon-yellow/20">
            <div className="text-xs text-dark-400 mb-1">Friends Tagged</div>
            <div className="text-2xl font-bold text-neon-yellow">12</div>
          </div>
          <div className="glassmorphism rounded-xl p-4 border border-neon-pink/20">
            <div className="text-xs text-dark-400 mb-1">Hot Zones Found</div>
            <div className="text-2xl font-bold text-neon-pink">8</div>
          </div>
          <div className="glassmorphism rounded-xl p-4 border border-neon-purple/20">
            <div className="text-xs text-dark-400 mb-1">Events Attended</div>
            <div className="text-2xl font-bold text-neon-purple">6</div>
          </div>
        </div>

        {/* Tier Info */}
        <div className="glassmorphism rounded-2xl p-6 border border-dark-600">
          <h3 className="font-bold text-neon-cyan mb-3">Current Tier Benefits</h3>
          <ul className="space-y-2 text-sm text-dark-200">
            {userProfile.tier === 'Rookie' && (
              <>
                <li>✨ 1x Pulse Points</li>
                <li>🔓 Access to basic venues</li>
                <li>📊 View public heatmaps</li>
              </>
            )}
            {userProfile.tier === 'Insider' && (
              <>
                <li>✨ 1.5x Pulse Points</li>
                <li>🔓 Early access to pop-ups</li>
                <li>💬 Priority in geo-fenced chat</li>
                <li>🎟️ Exclusive event discounts</li>
              </>
            )}
            {userProfile.tier === 'Influencer' && (
              <>
                <li>✨ 2x Pulse Points</li>
                <li>📍 Host verified pop-ups</li>
                <li>📣 Featured in trending vibes</li>
                <li>🎁 VIP perks & rewards</li>
                <li>👑 Exclusive Influencer events</li>
              </>
            )}
          </ul>
        </div>

        {/* Back Button */}
        <button
          onClick={() => setCurrentPage('map')}
          className="w-full px-4 py-3 bg-gradient-to-br from-dark-700 to-dark-800 border border-dark-600 hover:border-neon-cyan/50 text-dark-100 rounded-lg transition-all duration-200 font-semibold"
        >
          ← Back to Map
        </button>
      </div>
    </div>
  );
}
