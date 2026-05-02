import React, { useMemo } from 'react';
import { useStore } from '../store.js';

export default function StatsPanel() {
  const pulses = useStore((state) => state.pulses);

  const stats = useMemo(() => {
    let totalIntensity = 0;
    const venueMap = {};

    pulses.forEach(p => {
      const v = p.properties.venue || 'Unknown';
      const int = p.properties.intensity || 0;
      totalIntensity += int;

      if (!venueMap[v]) venueMap[v] = { count: 0, totalInt: 0 };
      venueMap[v].count += 1;
      venueMap[v].totalInt += int;
    });

    const avg = pulses.length ? ((totalIntensity / pulses.length) * 100).toFixed(0) : 0;
    
    const topVenues = Object.entries(venueMap)
      .map(([name, d]) => ({ name, score: d.totalInt / d.count, count: d.count }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Showing Top 3 to save space

    return { total: pulses.length, avg, topVenues };
  }, [pulses]);

  return (
    <div className="absolute top-4 left-4 z-40 glassmorphism rounded-2xl p-5 text-dark-50 shadow-2xl pointer-events-auto max-w-xs">
      <h2 className="text-neon-cyan font-bold tracking-wider mb-4 text-sm uppercase">📊 Live Metrics</h2>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-gradient-to-br from-dark-900/60 to-dark-800/40 rounded-lg p-3 border border-neon-cyan/20 backdrop-blur-sm">
          <div className="text-xs text-dark-400 font-semibold mb-1">Active Pulses</div>
          <div className="text-2xl font-mono font-bold text-neon-cyan">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-dark-900/60 to-dark-800/40 rounded-lg p-3 border border-neon-yellow/20 backdrop-blur-sm">
          <div className="text-xs text-dark-400 font-semibold mb-1">Vibe Level</div>
          <div className="text-2xl font-mono font-bold text-neon-yellow">{stats.avg}%</div>
        </div>
      </div>
      <div>
        <div className="text-xs text-dark-400 font-semibold mb-2 uppercase">🔥 Trending Venues</div>
        {stats.topVenues.length === 0 ? (
          <div className="text-sm text-dark-500 italic">No activity nearby</div>
        ) : (
          <div className="space-y-1">
            {stats.topVenues.map((v, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-dark-900/30 rounded border border-neon-pink/20 hover:border-neon-pink/50 transition-all backdrop-blur-sm">
                <span className="truncate max-w-[120px] text-dark-200">{v.name}</span>
                <span className="text-neon-pink font-mono text-xs font-bold ml-2 flex-shrink-0">{Math.round(v.score * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
