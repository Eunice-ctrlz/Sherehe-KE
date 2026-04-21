import axios from 'axios';
import { getOrCreateDeviceId } from './utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Automatically attach Device ID to every request
apiClient.interceptors.request.use((config) => {
  const deviceId = getOrCreateDeviceId();
  config.headers['X-Device-ID'] = deviceId;
  return config;
});

export const apiService = {
  createPulse: async (latitude, longitude, deviceId, venueName = "Live Location") => {
    // Matches the refactored {lat, lng, device_id, venue} backend signature!
    const payload = { 
      lat: latitude, 
      lng: longitude, 
      device_id: deviceId, 
      venue: venueName 
    };
    const response = await apiClient.post('/pulse', payload);
    return response.data;
  },

  getHeat: async (bounds) => {
    if (!bounds) return null;
    const { ne_lat, ne_lng, sw_lat, sw_lng } = bounds;
    const params = new URLSearchParams({
      ne_lat, ne_lng, sw_lat, sw_lng
    });
    const response = await apiClient.get(`/heat?${params.toString()}`);
    return response.data;
  },

  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};
