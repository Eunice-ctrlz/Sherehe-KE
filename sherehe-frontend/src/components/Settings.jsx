import React, { useState } from 'react';
import { useStore } from '../store.js';

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const deviceId = useStore((state) => state.deviceId);
  const setNotification = useStore((state) => state.setNotification);

  const copyId = () => {
    navigator.clipboard.writeText(deviceId);
    setNotification('Device ID Copied', 'success');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 z-40 bg-dark-800 text-neon-blue hover:text-neon-cyan border border-neon-blue/30 hover:border-neon-cyan/50 p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-lg pointer-events-auto"
        title="Settings"
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="glassmorphism rounded-2xl w-[90%] max-w-md p-6 relative shadow-2xl">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-dark-50 transition-colors text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-neon-cyan mb-1">Sherehe-KE</h2>
            <p className="text-xs text-dark-500 mb-6">Core Settings</p>
            
            <div className="space-y-5">
              <div>
                <p className="text-xs text-dark-400 font-semibold mb-2 uppercase tracking-wide">📱 Device ID</p>
                <div 
                  onClick={copyId}
                  className="bg-dark-900/40 text-dark-300 font-mono text-xs p-3 rounded-lg cursor-pointer hover:bg-dark-700/50 transition-all duration-200 flex justify-between items-center border border-neon-pink/30 hover:border-neon-pink/60 backdrop-blur-sm"
                >
                  <span className="truncate">{deviceId}</span>
                  <span className="text-neon-pink font-bold ml-2 flex-shrink-0">Copy</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-dark-400 font-semibold mb-2 uppercase tracking-wide">🔗 Backend</p>
                <div className="font-mono text-xs text-neon-yellow bg-dark-900/30 p-3 rounded-lg border border-neon-yellow/20 backdrop-blur-sm">
                  localhost:8000/api/v1
                </div>
              </div>

              <div className="border-t border-dark-700 pt-5 text-xs text-dark-500 text-center">
                <div className="font-semibold text-dark-400 mb-1">v1.0</div>
                <div className="text-dark-600">100% Anonymous • No Personal Data</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
