import { useState, useEffect } from 'react';
import { deviceAPI, sensorAPI } from '../services/api';
import { DEVICE_CONFIG, getDeviceId, setDeviceId } from '../config/deviceConfig';

const DeviceControl = () => {
  const [deviceStatus, setDeviceStatus] = useState({
    pump: false,
    autoMode: false,
    lampMode: 'MANUAL', // 'AUTO' hoặc 'MANUAL'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentDeviceId, setCurrentDeviceId] = useState(null);

  // Fetch devices list and get deviceId on mount
  useEffect(() => {
    fetchDevicesAndSetDeviceId();
  }, []);

  // Fetch device status after deviceId is set
  useEffect(() => {
    if (currentDeviceId) {
      fetchDeviceStatus();
      const interval = setInterval(fetchDeviceStatus, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentDeviceId]);

  // Fetch devices list from customerId and set the first deviceId
  const fetchDevicesAndSetDeviceId = async () => {
    try {
      // Get customerId from localStorage (saved during login)
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const customerId = userInfo.customerId || localStorage.getItem('customerId');
      
      if (!customerId) {
        console.error('CustomerId not found. Please login again.');
        setMessage('Không tìm thấy customerId. Vui lòng đăng nhập lại.');
        return;
      }

      // Fetch devices list
      const response = await deviceAPI.getCustomerDevices(customerId, {
        pageSize: 10,
        page: 0
      });

      const devices = response.data?.data || response.data || [];
      
      if (devices.length > 0) {
        // Get the first device's ID
        const deviceId = devices[0].id?.id || devices[0].id || devices[0].deviceId;
        
        if (deviceId) {
          // Save deviceId to localStorage
          setDeviceId(deviceId);
          setCurrentDeviceId(deviceId);
          console.log('DeviceId fetched and set:', deviceId);
        } else {
          console.error('DeviceId not found in device data:', devices[0]);
          setMessage('Không tìm thấy deviceId trong dữ liệu thiết bị.');
        }
      } else {
        console.error('No devices found for customerId:', customerId);
        setMessage('Không tìm thấy thiết bị nào cho customer này.');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setMessage('Lỗi khi lấy danh sách thiết bị: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchDeviceStatus = async () => {
    try {
      const deviceId = currentDeviceId || getDeviceId();
      if (!deviceId) {
        return;
      }
      
      const entityType = DEVICE_CONFIG.entityType;
      
      // Get device status from telemetry (pump_status, lamp_mode)
      // Response format: { "pump_status": [{ "ts": ..., "value": "ON" }], "lamp_mode": [{ "ts": ..., "value": "AUTO" }], ... }
      const keys = [
        DEVICE_CONFIG.telemetryKeys.pumpStatus,
        DEVICE_CONFIG.telemetryKeys.lampMode, // lamp_mode: "AUTO" hoặc "MANUAL"
      ];
      
      const response = await sensorAPI.getLatestTelemetry(entityType, deviceId, keys);
      const data = response.data || {};
      
      // Extract status values
      const pumpValue = data[DEVICE_CONFIG.telemetryKeys.pumpStatus]?.[0]?.value;
      const lampModeValue = data[DEVICE_CONFIG.telemetryKeys.lampMode]?.[0]?.value;
      
      // lamp_mode: "AUTO" hoặc "MANUAL" (có thể viết hoa hoặc thường)
      const isAutoMode = lampModeValue === 'AUTO' || lampModeValue === 'auto' || lampModeValue === 'Auto';
      const mode = isAutoMode ? 'AUTO' : 'MANUAL';
      
      setDeviceStatus({
        pump: pumpValue === 'ON' || pumpValue === 'on' || pumpValue === true || pumpValue === 1,
        autoMode: isAutoMode,
        lampMode: mode,
      });
    } catch (error) {
      console.error('Error fetching device status:', error);
      // Keep current status or set default
      setDeviceStatus(prev => prev);
    }
  };

  const handlePumpControl = async (action) => {
    try {
      setLoading(true);
      setMessage('');
      const deviceId = currentDeviceId || getDeviceId();
      if (!deviceId) {
        setMessage('Không tìm thấy deviceId. Vui lòng tải lại trang.');
        return;
      }
      
      const method = DEVICE_CONFIG.rpcMethods.setPump;
      const params = { action }; // { action: 'on' } or { action: 'off' }
      
      await deviceAPI.sendRPC(deviceId, method, params, false, 5000);
      setMessage(`Máy bơm đã được ${action === 'on' ? 'BẬT' : 'TẮT'}`);
      
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchDeviceStatus();
      }, 1000);
    } catch (error) {
      console.error('Error controlling pump:', error);
      setMessage('Lỗi khi điều khiển máy bơm: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Control auto mode using setLamp method - toggle (chỉ gửi state: true)
  const handleAutoModeControl = async () => {
    try {
      setLoading(true);
      setMessage('');
      const deviceId = currentDeviceId || getDeviceId();
      if (!deviceId) {
        setMessage('Không tìm thấy deviceId. Vui lòng tải lại trang.');
        return;
      }
      
      const method = 'setLamp';
      const params = { state: true }; // Chỉ gửi state: true để toggle chế độ tự động
      
      // Use the correct RPC endpoint: /api/rpc/oneway/{deviceId}
      // with payload: { method, params, persistent: false, timeout: 5000 }
      await deviceAPI.sendRPC(deviceId, method, params, false, 5000);
      setMessage('Đã gửi lệnh toggle chế độ tự động');
      
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchDeviceStatus();
      }, 1000);
    } catch (error) {
      console.error('Error controlling auto mode:', error);
      setMessage('Lỗi khi điều khiển chế độ tự động: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Điều khiển thiết bị</h1>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Lỗi') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Pump Control */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Máy bơm nước</h2>
              <p className="text-sm text-gray-600 mt-1">Điều khiển máy bơm tưới cây</p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              deviceStatus.pump ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              <span className="text-white font-bold text-xl">
                {deviceStatus.pump ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={() => handlePumpControl('on')}
              disabled={loading || deviceStatus.pump}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                deviceStatus.pump
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {deviceStatus.pump ? 'Đang BẬT' : 'BẬT máy bơm'}
            </button>
            <button
              onClick={() => handlePumpControl('off')}
              disabled={loading || !deviceStatus.pump}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                !deviceStatus.pump
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!deviceStatus.pump ? 'Đang TẮT' : 'TẮT máy bơm'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Trạng thái:</strong> {deviceStatus.pump ? 'Đang hoạt động' : 'Đã tắt'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Chức năng:</strong> Tưới nước tự động khi độ ẩm đất thấp
            </p>
          </div>
        </div>

        {/* Auto Mode Control */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Chế độ tự động</h2>
              <p className="text-sm text-gray-600 mt-1">Bật/tắt chế độ tự động</p>
            </div>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              deviceStatus.autoMode ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              <span className="text-white font-bold text-sm text-center px-1">
                {deviceStatus.lampMode}
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleAutoModeControl}
              disabled={loading}
              className={`w-full py-4 px-4 rounded-lg font-semibold transition-all ${
                deviceStatus.autoMode
                  ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                  : 'bg-gray-400 text-white hover:bg-gray-500 active:bg-gray-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                deviceStatus.autoMode ? 'TẮT chế độ tự động' : 'BẬT chế độ tự động'
              )}
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Chế độ hiện tại:</strong> <span className="font-semibold">{deviceStatus.lampMode}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Chức năng:</strong> {deviceStatus.autoMode 
                ? 'Hệ thống tự động điều khiển thiết bị theo ngưỡng đã cài đặt'
                : 'Điều khiển thiết bị thủ công'}
            </p>
          </div>
        </div>
      </div>

      {/* Device Status Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Tóm tắt trạng thái thiết bị</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Máy bơm nước</p>
            <p className={`text-2xl font-bold mt-2 ${
              deviceStatus.pump ? 'text-green-600' : 'text-gray-400'
            }`}>
              {deviceStatus.pump ? 'BẬT' : 'TẮT'}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Chế độ</p>
            <p className={`text-2xl font-bold mt-2 ${
              deviceStatus.autoMode ? 'text-green-600' : 'text-blue-600'
            }`}>
              {deviceStatus.lampMode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceControl;


