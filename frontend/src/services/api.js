import axios from 'axios';

const API_BASE_URL = 'https://iot.blask.id.vn';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để xử lý authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['X-Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Thêm interceptor để xử lý response errors (401 = unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API functions for sensor data (Telemetry)
export const sensorAPI = {
  // Get latest telemetry values (time series)
  // entityType: 'DEVICE', entityId: deviceId
  // keys: 'soilMoisture,airTemperature,airHumidity' hoặc array
  getLatestTelemetry: (entityType, entityId, keys) => {
    const keysParam = Array.isArray(keys) ? keys.join(',') : keys;
    return api.get(`/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`, {
      params: { keys: keysParam, useStrictDataTypes: false }
    });
  },
  
  // Get telemetry history with time range
  getTelemetryHistory: (entityType, entityId, keys, startTs, endTs, interval = 3600000) => {
    const keysParam = Array.isArray(keys) ? keys.join(',') : keys;
    return api.get(`/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`, {
      params: { 
        keys: keysParam,
        startTs,
        endTs,
        interval,
        intervalType: 'MILLISECONDS',
        useStrictDataTypes: false
      }
    });
  },
  
  // Get all time series keys for an entity
  getTelemetryKeys: (entityType, entityId) =>
    api.get(`/api/plugins/telemetry/${entityType}/${entityId}/keys/timeseries`),
  
  // Save telemetry data (nếu cần gửi dữ liệu từ frontend)
  saveTelemetry: (entityType, entityId, scope, data) =>
    api.post(`/api/plugins/telemetry/${entityType}/${entityId}/timeseries/${scope}`, data),
};

// API functions for device control
export const deviceAPI = {
  // Get device by ID
  getDevice: (deviceId) =>
    api.get(`/api/device/${deviceId}`),
  
  // Get device info
  getDeviceInfo: (deviceId) =>
    api.get(`/api/device/info/${deviceId}`),
  
  // Send one-way RPC command to device (điều khiển máy bơm, đèn sưởi)
  // method: 'setPump', 'setHeater', etc.
  // params: { action: 'on' } hoặc { action: 'off' }
  sendRPC: (deviceId, method, params, timeout = 10000) =>
    api.post(`/api/plugins/rpc/oneway/${deviceId}`, {
      method,
      params,
      timeout
    }),
  
  // Send two-way RPC (có response từ device)
  sendRPCWithResponse: (deviceId, method, params, timeout = 10000) =>
    api.post(`/api/plugins/rpc/twoway/${deviceId}`, {
      method,
      params,
      timeout
    }),
  
  // Get device attributes (SERVER_SCOPE, CLIENT_SCOPE, SHARED_SCOPE)
  getDeviceAttributes: (entityType, entityId, scope = 'SERVER_SCOPE', keys = null) => {
    const params = keys ? { keys: Array.isArray(keys) ? keys.join(',') : keys } : {};
    return api.get(`/api/plugins/telemetry/${entityType}/${entityId}/values/attributes/${scope}`, {
      params
    });
  },
  
  // Set device attributes (có thể dùng để lưu thresholds)
  setDeviceAttributes: (entityType, entityId, scope = 'SERVER_SCOPE', attributes) =>
    api.post(`/api/plugins/telemetry/${entityType}/${entityId}/attributes/${scope}`, attributes),
  
  // Delete device attributes
  deleteDeviceAttributes: (entityType, entityId, scope, keys = null) => {
    const params = keys ? { keys: Array.isArray(keys) ? keys.join(',') : keys } : {};
    return api.delete(`/api/plugins/telemetry/${entityType}/${entityId}/${scope}`, {
      params
    });
  },
};

// API functions for scenarios/thresholds (sử dụng Device Attributes)
export const scenarioAPI = {
  // Get thresholds from device server attributes
  getThresholds: (entityType, entityId) =>
    api.get(`/api/plugins/telemetry/${entityType}/${entityId}/values/attributes/SERVER_SCOPE`, {
      params: { 
        keys: 'soilMoistureMin,soilMoistureMax,temperatureMin,temperatureMax,humidityMin,humidityMax'
      }
    }),
  
  // Update thresholds (lưu vào device server attributes)
  updateThresholds: (entityType, entityId, thresholds) =>
    api.post(`/api/plugins/telemetry/${entityType}/${entityId}/attributes/SERVER_SCOPE`, thresholds),
  
  // Get all attribute keys
  getAttributeKeys: (entityType, entityId, scope = 'SERVER_SCOPE') =>
    api.get(`/api/plugins/telemetry/${entityType}/${entityId}/keys/attributes/${scope}`),
};

// API functions for predictions (sử dụng Telemetry)
export const predictionAPI = {
  // Get temperature predictions (giả sử có key 'temperaturePrediction' trong telemetry)
  getPredictions: (entityType, entityId) =>
    api.get(`/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`, {
      params: { keys: 'temperaturePrediction', useStrictDataTypes: false }
    }),
  
  // Get prediction history
  getPredictionHistory: (entityType, entityId, startTs, endTs) =>
    api.get(`/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`, {
      params: { 
        keys: 'temperaturePrediction',
        startTs,
        endTs,
        interval: 3600000,
        intervalType: 'MILLISECONDS',
        useStrictDataTypes: false
      }
    }),
};

// API functions for logs (Audit Log)
export const logAPI = {
  // Get all audit logs
  getAuditLogs: (params = {}) => {
    const {
      pageSize = 100,
      page = 0,
      textSearch = '',
      sortProperty = 'createdTime',
      sortOrder = 'DESC',
      startTime,
      endTime,
      actionTypes
    } = params;
    
    return api.get(`/api/audit/logs`, {
      params: {
        pageSize,
        page,
        textSearch,
        sortProperty,
        sortOrder,
        startTime,
        endTime,
        actionTypes
      }
    });
  },
  
  // Get audit logs by entity (device)
  getDeviceLogs: (entityType, entityId, params = {}) => {
    const {
      pageSize = 100,
      page = 0,
      textSearch = '',
      sortProperty = 'createdTime',
      sortOrder = 'DESC',
      startTime,
      endTime,
      actionTypes
    } = params;
    
    return api.get(`/api/audit/logs/entity/${entityType}/${entityId}`, {
      params: {
        pageSize,
        page,
        textSearch,
        sortProperty,
        sortOrder,
        startTime,
        endTime,
        actionTypes
      }
    });
  },
  
  // Get audit logs by user
  getUserLogs: (userId, params = {}) => {
    const {
      pageSize = 100,
      page = 0,
      textSearch = '',
      sortProperty = 'createdTime',
      sortOrder = 'DESC',
      startTime,
      endTime,
      actionTypes
    } = params;
    
    return api.get(`/api/audit/logs/user/${userId}`, {
      params: {
        pageSize,
        page,
        textSearch,
        sortProperty,
        sortOrder,
        startTime,
        endTime,
        actionTypes
      }
    });
  },
};

// Authentication (nếu cần)
export const authAPI = {
  login: (username, password) =>
    api.post(`/api/auth/login`, { username, password }),
  
  logout: () =>
    api.post(`/api/auth/logout`),
  
  refreshToken: (refreshToken) =>
    api.post(`/api/auth/token`, { refreshToken }),
};

export default api;