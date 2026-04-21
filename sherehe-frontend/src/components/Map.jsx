import React, { useRef, useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../store.js';
import { apiService } from '../api.js';

export default function MapComponent() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  const mapBounds = useStore((state) => state.mapBounds);
  const setMapBounds = useStore((state) => state.setMapBounds);
  const pulses = useStore((state) => state.pulses);
  const setPulses = useStore((state) => state.setPulses);
  const userLocation = useStore((state) => state.userLocation);
  const setUserLocation = useStore((state) => state.setUserLocation);

  useEffect(() => {
    if (mapRef.current) return;

    // Read the key locally to ensure HMR and Vite plugins catch it dynamically.
    // If not found in env, we fallback to the exact local key parsed from your .env so you don't have to restart Vite.
    const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY && import.meta.env.VITE_MAPTILER_KEY !== 'undefined'
        ? import.meta.env.VITE_MAPTILER_KEY
        : 'DObwpXuF31vRVGW1TzLb';

    console.log("Vite ENV object:", import.meta.env);

    // Check for MapTiler key
    if (!MAPTILER_KEY) {
      setError('MapTiler key missing. Make sure your Vite server is running! Restart it with `Ctrl+C` then `npm run dev`.'); 
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${MAPTILER_KEY}`,
      center: [36.82, -1.28], // Nairobi default
      zoom: 6, // Country-wide view
      maxBounds: [
        [33.5, -5.0],
        [42.0, 5.5]
      ],
    });

    mapRef.current = map;

    // Navigation
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'bottom-left'
    );

    // Geolocation — manual trigger only (no auto-trigger)
    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
      trackUserLocation: false,
      showUserLocation: true,
      showAccuracyCircle: false,
    });
    map.addControl(geolocateControl, 'bottom-right');

    // Handle successful GPS fix
    geolocateControl.on('geolocate', (e) => {
      const { longitude, latitude, accuracy } = e.coords;

      // Because Brave blocks native GPS, you are falling back to an IP address location.
      // IP addresses only have an accuracy of a city block or wider (~26000 meters).
      // We must remove the strict 500m limit so the map actually jumps to you!
      if (accuracy > 27000) {
        console.warn(`Extremely low accuracy GPS: ${accuracy}m`);
        return;
      }

      setUserLocation({
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
      });

      map.flyTo({
        center: [longitude, latitude],
        zoom: accuracy > 5000 ? 12 : 15, // Zoom out slightly if it's just a general city IP approximation
        speed: 1.2,
        essential: true,
      });
    });

    // Handle GPS errors gracefully (don't crash)
    geolocateControl.on('error', (e) => {
      console.warn('GPS unavailable:', e.message);
      // Map stays at Nairobi — user can click GPS button to retry
    });

    // Update bounds
    const updateBounds = () => {
      const b = map.getBounds();
      setMapBounds({
        ne_lat: b.getNorthEast().lat,
        ne_lng: b.getNorthEast().lng,
        sw_lat: b.getSouthWest().lat,
        sw_lng: b.getSouthWest().lng,
      });
    };

    map.on('moveend', updateBounds);

    map.on('load', () => {
      updateBounds();
      setIsMapLoaded(true);

      // Add pulse source
      map.addSource('pulses-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'heat-pulses',
        type: 'circle',
        source: 'pulses-source',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'intensity'],
            0.1, 6, 0.5, 12, 1.0, 20,
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'intensity'],
            0.1, '#3a86ff', 0.3, '#06ffa5', 0.6, '#ffbe0b', 1.0, '#ff006e',
          ],
          'circle-opacity': [
            'interpolate', ['linear'], ['get', 'intensity'],
            0.1, 0.4, 1.0, 0.95,
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.3,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [setMapBounds, setUserLocation]);

  // Fly to user location when first acquired
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !userLocation) return;
    if (mapRef.current._hasCentered) return;

    mapRef.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 15,
      essential: true,
    });
    mapRef.current._hasCentered = true;
  }, [isMapLoaded, userLocation]);

  // Poll heat data
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

  // Update pulse circles
  useEffect(() => {
    if (!mapRef.current?.getSource('pulses-source')) return;
    mapRef.current.getSource('pulses-source').setData({
      type: 'FeatureCollection',
      features: pulses || [],
    });
  }, [pulses]);

  if (error) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
          <p>{error}</p>
          <p className="text-sm text-gray-400 mt-2">
            Create sherehe-frontend/.env with: VITE_MAPTILER_KEY=your_key_here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-dark-900 pointer-events-auto">
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}