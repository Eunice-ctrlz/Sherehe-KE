export const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('sherehe_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sherehe_device_id', deviceId);
  }
  return deviceId;
};

export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Fallback to IP-based location if completely unsupported
      fetchIpLocation().then(resolve).catch(reject);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.warn("GPS geolocation failed. Falling back to IP-based location...", error);
        fetchIpLocation().then(resolve).catch(() => reject(error));
      },
      // Dropping HighAccuracy requirement to prevent Windows Desktop timeout from crashing Chrome/Brave.
      // Dropping timeout to 3 seconds so IP-fallback triggers almost instantly if blocked.
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 30000 }
    );
  });
};

const fetchIpLocation = async () => {
  try {
    // ip-api.com returns JSON and properly handles CORS for localhost correctly
    const res = await fetch('http://ip-api.com/json/');
    const data = await res.json();
    if (data && data.lat && data.lon) {
      return {
        latitude: data.lat,
        longitude: data.lon,
        accuracy: 10000 // IP is roughly city level
      };
    }
    throw new Error('Invalid IP location data');
  } catch (err) {
    throw err;
  }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
};

export const formatTimeRemaining = (totalSeconds) => {
  if (totalSeconds <= 0) return "Ready";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const hapticFeedback = (type = 'success') => {
  if (!navigator.vibrate) return;
  if (type === 'success') {
    navigator.vibrate([30, 50, 30]);
  } else if (type === 'error') {
    navigator.vibrate([100, 50, 100]);
  } else if (type === 'light') {
    navigator.vibrate(10);
  }
};

export const getHeatColor = (intensity) => {
  if (intensity >= 0.8) return '#ff006e'; // Hot - Red
  if (intensity >= 0.5) return '#ffbe0b'; // Warm - Yellow
  if (intensity >= 0.2) return '#06ffa5'; // Cool - Cyan
  return '#3a86ff'; // Cold - Blue
};
