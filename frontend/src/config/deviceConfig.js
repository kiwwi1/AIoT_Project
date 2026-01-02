// Device configuration
// Cần cập nhật các giá trị này theo thiết bị thực tế của bạn

export const DEVICE_CONFIG = {
  // Entity Type (thường là 'DEVICE' cho ThingsBoard)
  entityType: 'DEVICE',
  
  // Device ID từ ThingsBoard (cần thay bằng ID thực tế)
  // Có thể lấy từ ThingsBoard UI hoặc API
  deviceId: 'YOUR_DEVICE_ID_HERE',
  
  // Telemetry keys từ cảm biến
  telemetryKeys: {
    soilMoisture: 'soilMoisture',      // Độ ẩm đất
    airTemperature: 'airTemperature',  // Nhiệt độ không khí
    airHumidity: 'airHumidity',         // Độ ẩm không khí
    pumpStatus: 'pumpStatus',           // Trạng thái máy bơm
    heaterStatus: 'heaterStatus',       // Trạng thái đèn sưởi
    temperaturePrediction: 'temperaturePrediction', // Dự báo nhiệt độ
  },
  
  // RPC methods để điều khiển thiết bị
  rpcMethods: {
    setPump: 'setPump',       // Điều khiển máy bơm
    setHeater: 'setHeater',   // Điều khiển đèn sưởi
  },
  
  // Attribute keys cho thresholds (lưu trong SERVER_SCOPE)
  thresholdKeys: [
    'soilMoistureMin',
    'soilMoistureMax',
    'temperatureMin',
    'temperatureMax',
    'humidityMin',
    'humidityMax',
  ],
};

// Helper function để lấy deviceId từ localStorage hoặc config
export const getDeviceId = () => {
  return localStorage.getItem('deviceId') || DEVICE_CONFIG.deviceId;
};

// Helper function để set deviceId
export const setDeviceId = (deviceId) => {
  localStorage.setItem('deviceId', deviceId);
};

// Helper function để lấy customerId từ token hoặc localStorage
export const getCustomerId = () => {
  // First try to get from localStorage (saved during login)
  const savedCustomerId = localStorage.getItem('customerId');
  if (savedCustomerId) {
    return savedCustomerId;
  }
  
  // If not found, try to decode from token
  // Dynamic import to avoid circular dependency
  import('../utils/tokenUtils').then(({ getCustomerIdFromToken }) => {
    const customerId = getCustomerIdFromToken();
    if (customerId) {
      localStorage.setItem('customerId', customerId);
    }
  });
  
  // For synchronous access, try to decode directly
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const customerId = payload.customerId || payload.customer_id || null;
        if (customerId) {
          localStorage.setItem('customerId', customerId);
          return customerId;
        }
      }
    }
  } catch (error) {
    console.error('Error getting customerId:', error);
  }
  
  return null;
};

