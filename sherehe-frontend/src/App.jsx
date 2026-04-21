import React, { useEffect } from 'react';
import MapComponent from './components/Map.jsx';
import PulseButton from './components/PulseButton.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import SettingsPanel from './components/Settings.jsx';
import Notifications from './components/Notifications.jsx';
import { useStore } from './store.js';
import { getUserLocation } from './utils.js';

export default function App() {
  const setUserLocation = useStore((state) => state.setUserLocation);
  const setNotification = useStore((state) => state.setNotification);

  // Automatically request Location Tracking to feed the map center
  useEffect(() => {
    let timeoutId;
    getUserLocation()
      .then((loc) => {
        setUserLocation(loc);
        setNotification("Live GPS Connected", "success");
      })
      .catch((err) => {
        console.error(err);
        setNotification("Please allow location access.", "error");
      });
      
    // Cleanup
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark-900 font-sans antialiased text-dark-50 selection:bg-neon-pink selection:text-white">
      {/* 
        This is exactly the Root Component orchestration outlined 
        in your master "Frontend Building Structure" guide!
      */}
      
      {/* 1. Underlying Mapbox Layer */}
      <MapComponent />
      
      {/* 2. Overlay Layer Container (Pointer Events None to click through empty space) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Panels */}
        <StatsPanel />
        <Notifications />
        
        {/* Bottom Floating Controls */}
        <PulseButton />
        <SettingsPanel />
      </div>
    </div>
  );
}
