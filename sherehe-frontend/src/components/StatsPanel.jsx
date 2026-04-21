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
    <div className="absolute top-4 left-4 z-40 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-xl p-4 text-dark-50 shadow-lg pointer-events-auto">
      <h2 className="text-neon-cyan font-bold tracking-wider mb-2">LIVE METRICS</h2>
      <div className="flex gap-4 mb-4">
        <div>
          <div className="text-xs text-dark-400">Active Pulses</div>
          <div className="text-xl font-mono">{stats.total}</div>
        </div>
        <div>
          <div className="text-xs text-dark-400">Vibe level</div>
          <div className="text-xl font-mono text-neon-yellow">{stats.avg}%</div>
        </div>
      </div>
      <div>
        <div className="text-xs text-dark-400 mb-1">Top Venues</div>
        {stats.topVenues.length === 0 ? (
          <div className="text-sm text-dark-500 italic">No activity locally</div>
        ) : (
          stats.topVenues.map((v, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1 border-b border-dark-700 last:border-0">
              <span className="truncate max-w-[120px]">{v.name}</span>
              <span className="text-neon-pink font-mono text-xs">{Math.round(v.score * 100)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
