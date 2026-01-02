import axios from 'axios';

const API_BASE_URL = 'https://iot.blask.id.vn';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for sensor data
export const sensorAPI = {
  // Get soil moisture data
  getSoilMoisture: () => api.get('/api/sensors/soil-moisture'),
  
  // Get air temperature and humidity data
  getAirData: () => api.get('/api/sensors/air'),
  
  // Get all sensor data
  getAllSensorData: () => api.get('/api/sensors'),
  
  // Get sensor data history
  getSensorHistory: (days = 7) => api.get(`/api/sensors/history?days=${days}`),
};

// API functions for device control
export const deviceAPI = {
  // Get device status
  getDeviceStatus: () => api.get('/api/devices/status'),
  
  // Control water pump
  controlPump: (action) => api.post('/api/devices/pump', { action }), // action: 'on' or 'off'
  
  // Control heater lamp
  controlHeater: (action) => api.post('/api/devices/heater', { action }), // action: 'on' or 'off'
  
  // Get device history
  getDeviceHistory: (days = 7) => api.get(`/api/devices/history?days=${days}`),
};

// API functions for scenarios/thresholds
export const scenarioAPI = {
  // Get current thresholds
  getThresholds: () => api.get('/api/scenarios/thresholds'),
  
  // Update thresholds
  updateThresholds: (thresholds) => api.put('/api/scenarios/thresholds', thresholds),
  
  // Get scenario history
  getScenarioHistory: (days = 7) => api.get(`/api/scenarios/history?days=${days}`),
};

// API functions for predictions
export const predictionAPI = {
  // Get temperature predictions
  getPredictions: () => api.get('/api/predictions/temperature'),
  
  // Get prediction history
  getPredictionHistory: (days = 7) => api.get(`/api/predictions/history?days=${days}`),
};

// API functions for logs
export const logAPI = {
  // Get system logs
  getLogs: (days = 7) => api.get(`/api/logs?days=${days}`),
  
  // Get sensor logs
  getSensorLogs: (days = 7) => api.get(`/api/logs/sensors?days=${days}`),
  
  // Get device logs
  getDeviceLogs: (days = 7) => api.get(`/api/logs/devices?days=${days}`),
  
  // Get user command logs
  getUserLogs: (days = 7) => api.get(`/api/logs/users?days=${days}`),
};

export default api;


