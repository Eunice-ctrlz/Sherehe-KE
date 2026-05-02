import React, { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store.js';
import { apiService } from '../api.js';

export default function MapComponent() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const pulseLayerRef = useRef(null);

  const mapBounds = useStore((state) => state.mapBounds);
  const setMapBounds = useStore((state) => state.setMapBounds);
  const pulses = useStore((state) => state.pulses);
  const setPulses = useStore((state) => state.setPulses);
  const userLocation = useStore((state) => state.userLocation);
  const setUserLocation = useStore((state) => state.setUserLocation);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapRef.current) return;

    console.log('Initializing Leaflet map...');

    // Create map centered on Nairobi
    const map = L.map(mapContainer.current).setView([-1.28, 36.82], 13);

    // Add OpenStreetMap tiles (reliable, always works)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Handle bounds change when user pans/zooms
    const updateBounds = () => {
      const bounds = map.getBounds();
      setMapBounds({
        ne_lat: bounds.getNorth(),
        ne_lng: bounds.getEast(),
        sw_lat: bounds.getSouth(),
        sw_lng: bounds.getWest(),
      });
    };

    map.on('moveend', updateBounds);
    updateBounds();

    // Add GPS button for manual geolocation (bottom right corner)
    const gpsButton = L.control({ position: 'bottomright' });
    gpsButton.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = '<button style="width:40px; height:40px; cursor:pointer; font-size:20px; border:2px solid #3a86ff; background:#1a1a2e; border-radius:8px; box-shadow:0 4px 12px rgba(58,134,255,0.3); transition:all 0.2s ease; color:#3a86ff;" title="Get my location">📍</button>';
      
      const btn = div.querySelector('button');
      btn.onmouseover = () => {
        btn.style.background = '#2a2a4e';
        btn.style.boxShadow = '0 6px 20px rgba(58,134,255,0.5)';
      };
      btn.onmouseout = () => {
        btn.style.background = '#1a1a2e';
        btn.style.boxShadow = '0 4px 12px rgba(58,134,255,0.3)';
      };
      
      btn.onclick = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ latitude, longitude, accuracy: pos.coords.accuracy });
            map.flyTo([latitude, longitude], 15, { duration: 1.5 });
          },
          (err) => console.warn('GPS error:', err)
        );
      };
      return div;
    };
    gpsButton.addTo(map);

    // Create pulse layer group
    pulseLayerRef.current = L.featureGroup().addTo(map);

    console.log('Map initialized and ready. Awaiting user location...');
    setIsMapLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [setMapBounds, setUserLocation]);

  // Auto-fly to user location when GPS acquires position
  useEffect(() => {
    if (!mapRef.current || !userLocation) {
      console.log('Waiting for map and location:', { mapReady: !!mapRef.current, hasLocation: !!userLocation });
      return;
    }

    console.log('User location available, flying to:', userLocation);
    mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15, { 
      animate: true,
      duration: 1.5 
    });
  }, [userLocation]);

  // Poll heat data from backend
  useEffect(() => {
    if (!mapRef.current) return;

    const fetchHeat = async () => {
      if (!mapBounds) return;
      try {
        const data = await apiService.getHeat(mapBounds);
        if (data?.features) setPulses(data.features);
      } catch (err) {
        console.error('Failed to fetch heat', err);
      }
    };

    fetchHeat();
    const interval = setInterval(fetchHeat, 10000);
    return () => clearInterval(interval);
  }, [mapBounds, setPulses]);

  // Render heat pulses on the map
  useEffect(() => {
    if (!pulseLayerRef.current || !pulses) return;

    pulseLayerRef.current.clearLayers();

    pulses.forEach((pulse) => {
      if (pulse.geometry?.coordinates) {
        const [lng, lat] = pulse.geometry.coordinates;
        const intensity = pulse.properties?.intensity || 0.5;

        // Color gradient based on intensity
        let color = '#3a86ff'; // cold blue
        if (intensity >= 0.8) color = '#ff006e'; // hot red
        else if (intensity >= 0.6) color = '#ffbe0b'; // warm yellow
        else if (intensity >= 0.3) color = '#06ffa5'; // cool cyan

        const radius = 8 + intensity * 12;

        L.circleMarker([lat, lng], {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.6,
        }).addTo(pulseLayerRef.current);
      }
    });
  }, [pulses]);

  return (
    <div className="absolute inset-0 bg-dark-900 pointer-events-auto z-0">
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
