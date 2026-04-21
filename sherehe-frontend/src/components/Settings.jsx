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
        className="fixed bottom-8 left-8 z-40 bg-dark-800 text-neon-blue hover:text-neon-cyan border border-dark-700 p-3 rounded-full shadow-lg transition-colors pointer-events-auto"
      >
        Set
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-[90%] max-w-md p-6 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-dark-500 hover:text-dark-50 transition-colors"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-neon-cyan mb-4">Sherehe-KE Core</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-dark-400 mb-1">Anonymous Tracking ID</p>
                <div 
                  onClick={copyId}
                  className="bg-dark-900 text-dark-300 font-mono text-xs p-3 rounded cursor-pointer hover:bg-dark-700 transition-colors flex justify-between"
                >
                  <span className="truncate">{deviceId}</span>
                  <span className="text-neon-pink">Copy</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-dark-400 mb-1">Live Backend Connect</p>
                <div className="font-mono text-sm text-neon-yellow">http://localhost:8000/api/v1</div>
              </div>

              <div className="border-t border-dark-700 pt-4 text-xs text-dark-500 text-center italic">
                v1.0 | 100% Anonymous Web App | No personal data stored
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
