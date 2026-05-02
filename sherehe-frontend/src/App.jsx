import React, { useEffect } from 'react';
import MapComponent from './components/Map.jsx';
import PulseButton from './components/PulseButton.jsx';
import SettingsPanel from './components/Settings.jsx';
import SearchVenues from './components/SearchVenues.jsx';
import VibeFeed from './components/VibeFeed.jsx';
import ProfileScreen from './components/ProfileScreen.jsx';
import HostMode from './components/HostMode.jsx';
import DoorIntel from './components/DoorIntel.jsx';
import BottomNavigation from './components/BottomNavigation.jsx';
import Notifications from './components/Notifications.jsx';
import { useStore } from './store.js';
import { getUserLocation } from './utils.js';

export default function App() {
  const setUserLocation = useStore((state) => state.setUserLocation);
  const setNotification = useStore((state) => state.setNotification);
  const currentPage = useStore((state) => state.currentPage);
  const showHostMode = useStore((state) => state.showHostMode);
  const showDoorIntel = useStore((state) => state.showDoorIntel);

  // Automatically request Location Tracking to feed the map center
  useEffect(() => {
    console.log('App mounted - requesting GPS location immediately...');
    getUserLocation()
      .then((loc) => {
        console.log('GPS location acquired:', loc);
        setUserLocation(loc);
        setNotification("Live GPS Connected", "success");
      })
      .catch((err) => {
        console.error('GPS failed:', err);
        setNotification("Please allow location access.", "error");
      });
      
    // Cleanup
    return () => {};
  }, [setUserLocation, setNotification]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dark-900 font-sans antialiased text-dark-50 selection:bg-neon-pink selection:text-white">
      {/* PAGE ROUTING */}
      {currentPage === 'map' && (
        <>
          {/* Map Layer */}
          <MapComponent />
          
          {/* Map Overlays */}
          <div className="absolute inset-0 pointer-events-none z-50">
            <SearchVenues />
            <VibeFeed />
            <Notifications />
            <PulseButton />
            <SettingsPanel />
          </div>
        </>
      )}

      {currentPage === 'vibe-feed' && (
        <div className="w-full h-full overflow-hidden">
          <VibeFeed fullScreen={true} />
          <Notifications />
          <SettingsPanel />
        </div>
      )}

      {currentPage === 'profile' && (
        <div className="w-full h-full overflow-hidden">
          <ProfileScreen />
          <Notifications />
          <SettingsPanel />
        </div>
      )}

      {/* Global Modals */}
      {showHostMode && <HostMode />}
      {showDoorIntel && <DoorIntel />}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
