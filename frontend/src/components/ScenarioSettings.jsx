import { useState, useEffect } from 'react';
import { deviceAPI, sensorAPI } from '../services/api';
import { DEVICE_CONFIG, getDeviceId } from '../config/deviceConfig';

const ScenarioSettings = () => {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [message, setMessage] = useState('');
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  
  // Configuration state
  const [config, setConfig] = useState({
    soil_threshold_low: '',
    soil_threshold_high: '',
    temp_threshold_low: '',
    temp_threshold_high: '',
  });

  useEffect(() => {
    const deviceId = getDeviceId();
    if (deviceId) {
      setCurrentDeviceId(deviceId);
      // Load from localStorage first, then fetch from telemetry
      loadConfigFromStorage();
      fetchConfigFromTelemetry(deviceId);
    }
  }, []);

  // Load config from localStorage
  const loadConfigFromStorage = () => {
    try {
      const savedConfig = localStorage.getItem('deviceConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({
          ...prev,
          ...parsed
        }));
      }
    } catch (error) {
      console.error('Error loading config from storage:', error);
    }
  };

  // Save config to localStorage
  const saveConfigToStorage = (configToSave) => {
    try {
      localStorage.setItem('deviceConfig', JSON.stringify(configToSave));
    } catch (error) {
      console.error('Error saving config to storage:', error);
    }
  };

  // Fetch config values from telemetry
  const fetchConfigFromTelemetry = async (deviceId) => {
    try {
      setLoadingConfig(true);
      const entityType = DEVICE_CONFIG.entityType;
      
      // Get config values from telemetry keys
      const keys = ['soil_threshold_low', 'soil_threshold_high', 'temp_threshold_low', 'temp_threshold_high'];
      const response = await sensorAPI.getLatestTelemetry(entityType, deviceId, keys);
      const data = response.data || {};
      
      console.log('Fetched config from telemetry:', data);
      
      // Extract values from telemetry response
      // Format: { "soil_threshold_low": [{ "ts": ..., "value": "30" }], ... }
      // Use current config as fallback (which may have been loaded from localStorage)
      setConfig(prev => {
        const getValue = (telemetryValue, prevValue) => {
          if (telemetryValue !== undefined && telemetryValue !== null) {
            const parsed = parseFloat(telemetryValue);
            return isNaN(parsed) ? prevValue : parsed;
          }
          return prevValue;
        };
        
        const newConfig = {
          soil_threshold_low: getValue(data.soil_threshold_low?.[0]?.value, prev.soil_threshold_low),
          soil_threshold_high: getValue(data.soil_threshold_high?.[0]?.value, prev.soil_threshold_high),
          temp_threshold_low: getValue(data.temp_threshold_low?.[0]?.value, prev.temp_threshold_low),
          temp_threshold_high: getValue(data.temp_threshold_high?.[0]?.value, prev.temp_threshold_high),
        };
        
        // Save to localStorage if we got values from telemetry
        if (data.soil_threshold_low?.[0]?.value !== undefined || 
            data.soil_threshold_high?.[0]?.value !== undefined ||
            data.temp_threshold_low?.[0]?.value !== undefined ||
            data.temp_threshold_high?.[0]?.value !== undefined) {
          saveConfigToStorage(newConfig);
        }
        
        return newConfig;
      });
    } catch (error) {
      console.error('Error fetching config from telemetry:', error);
      // Keep values from localStorage or default if fetch fails
    } finally {
      setLoadingConfig(false);
    }
  };

  // Handle RPC: updateConfig
  const handleUpdateConfig = async () => {
    try {
      setLoading(true);
      setMessage('');
      const deviceId = currentDeviceId || getDeviceId();
      if (!deviceId) {
        setMessage('Không tìm thấy deviceId. Vui lòng tải lại trang.');
        setLoading(false);
        return;
      }

      // Validate that all values are provided
      const soilLow = parseFloat(config.soil_threshold_low);
      const soilHigh = parseFloat(config.soil_threshold_high);
      const tempLow = parseFloat(config.temp_threshold_low);
      const tempHigh = parseFloat(config.temp_threshold_high);

      if (isNaN(soilLow) || isNaN(soilHigh) || isNaN(tempLow) || isNaN(tempHigh)) {
        setMessage('Vui lòng nhập đầy đủ các giá trị ngưỡng.');
        setLoading(false);
        return;
      }

      const method = 'updateConfig';
      const params = {
        soil_low: soilLow,
        soil_high: soilHigh,
        temp_low: tempLow,
        temp_high: tempHigh,
      };

      await deviceAPI.sendRPC(deviceId, method, params, false, 5000);
      
      // Save to localStorage after successful update
      saveConfigToStorage({
        soil_threshold_low: soilLow,
        soil_threshold_high: soilHigh,
        temp_threshold_low: tempLow,
        temp_threshold_high: tempHigh,
      });
      
      setMessage('Cấu hình đã được cập nhật và lưu thành công!');
    } catch (error) {
      console.error('Error sending updateConfig RPC:', error);
      setMessage('Lỗi khi cập nhật cấu hình: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Cài đặt Kịch bản</h1>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Lỗi') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      {/* Configuration Update */}
      <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cập nhật Cấu hình</h2>
        <p className="text-sm text-gray-600 mb-6">Gửi lệnh RPC updateConfig để cập nhật ngưỡng cảm biến</p>
        
        {loadingConfig ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Đang tải cấu hình từ thiết bị...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Độ ẩm đất thấp (soil_threshold_low)
                </label>
                <input
                  type="number"
                  value={config.soil_threshold_low}
                  onChange={(e) => handleConfigChange('soil_threshold_low', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Độ ẩm đất cao (soil_threshold_high)
                </label>
                <input
                  type="number"
                  value={config.soil_threshold_high}
                  onChange={(e) => handleConfigChange('soil_threshold_high', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhiệt độ thấp (temp_threshold_low)
                </label>
                <input
                  type="number"
                  value={config.temp_threshold_low}
                  onChange={(e) => handleConfigChange('temp_threshold_low', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhiệt độ cao (temp_threshold_high)
                </label>
                <input
                  type="number"
                  value={config.temp_threshold_high}
                  onChange={(e) => handleConfigChange('temp_threshold_high', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="30"
                />
              </div>
            </div>
          </>
        )}

        {!loadingConfig && (
          <button
            onClick={handleUpdateConfig}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all bg-green-500 text-white hover:bg-green-600 active:bg-green-700 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang gửi...
              </span>
            ) : (
              'Cập nhật Cấu hình (updateConfig)'
            )}
          </button>
        )}

      </div>
    </div>
  );
};

export default ScenarioSettings;
