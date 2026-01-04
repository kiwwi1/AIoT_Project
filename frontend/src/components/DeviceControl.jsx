import { useState, useEffect } from 'react';
import { deviceAPI, sensorAPI } from '../services/api';
import { DEVICE_CONFIG, getDeviceId, setDeviceId } from '../config/deviceConfig';

const DeviceControl = () => {
  const [deviceStatus, setDeviceStatus] = useState({
    pump: false,
    pumpMode: 'MANUAL', // 'AUTO' hoặc 'MANUAL'
    pumpStatus: 'OFF', // 'ON' hoặc 'OFF'
    autoMode: false,
    lampMode: 'MANUAL', // 'AUTO' hoặc 'MANUAL'
    lampStatus: 'OFF', // 'ON' hoặc 'OFF'
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
      
      // Get device status from telemetry (pump_mode, pump_status, lamp_mode, lamp_status)
      // Response format: { "pump_mode": [{ "ts": ..., "value": "AUTO" }], "pump_status": [{ "ts": ..., "value": "ON" }], ... }
      const keys = [
        DEVICE_CONFIG.telemetryKeys.pumpMode, // pump_mode: "AUTO" hoặc "MANUAL"
        DEVICE_CONFIG.telemetryKeys.pumpStatus, // pump_status: "ON" hoặc "OFF"
        DEVICE_CONFIG.telemetryKeys.lampMode, // lamp_mode: "AUTO" hoặc "MANUAL"
        DEVICE_CONFIG.telemetryKeys.lampStatus, // lamp_status: "ON" hoặc "OFF"
      ];
      
      const response = await sensorAPI.getLatestTelemetry(entityType, deviceId, keys);
      const data = response.data || {};
      
      // Extract status values
      const pumpModeValue = data[DEVICE_CONFIG.telemetryKeys.pumpMode]?.[0]?.value;
      const pumpStatusValue = data[DEVICE_CONFIG.telemetryKeys.pumpStatus]?.[0]?.value;
      const lampModeValue = data[DEVICE_CONFIG.telemetryKeys.lampMode]?.[0]?.value;
      const lampStatusValue = data[DEVICE_CONFIG.telemetryKeys.lampStatus]?.[0]?.value;
      
      // Debug logging
      console.log('Telemetry data:', data);
      console.log('pump_mode raw value:', pumpModeValue);
      console.log('pump_status raw value:', pumpStatusValue);
      console.log('lamp_mode raw value:', lampModeValue);
      console.log('lamp_status raw value:', lampStatusValue);
      
      // pump_mode: "AUTO" hoặc "MANUAL" (có thể viết hoa hoặc thường, hoặc là string)
      const pumpModeStr = String(pumpModeValue || '').trim().toUpperCase();
      const isPumpAuto = pumpModeStr === 'AUTO';
      const pumpMode = isPumpAuto ? 'AUTO' : 'MANUAL';
      
      // pump_status: "ON" hoặc "OFF" (có thể viết hoa hoặc thường, hoặc là boolean)
      const pumpStatusStr = String(pumpStatusValue || '').trim().toUpperCase();
      const isPumpOn = pumpStatusStr === 'ON' || pumpStatusValue === true || pumpStatusValue === 1;
      const pumpStatus = isPumpOn ? 'ON' : 'OFF';
      
      // lamp_mode: "AUTO" hoặc "MANUAL" (có thể viết hoa hoặc thường, hoặc là string)
      const lampModeStr = String(lampModeValue || '').trim().toUpperCase();
      const isAutoMode = lampModeStr === 'AUTO';
      const lampMode = isAutoMode ? 'AUTO' : 'MANUAL';
      
      // lamp_status: "ON" hoặc "OFF" (có thể viết hoa hoặc thường, hoặc là boolean)
      const lampStatusStr = String(lampStatusValue || '').trim().toUpperCase();
      const isLampOn = lampStatusStr === 'ON' || lampStatusValue === true || lampStatusValue === 1;
      const lampStatus = isLampOn ? 'ON' : 'OFF';
      
      console.log('Parsed pumpMode:', pumpMode, 'pumpStatus:', pumpStatus, 'isPumpAuto:', isPumpAuto);
      console.log('Parsed lampMode:', lampMode, 'lampStatus:', lampStatus, 'isAutoMode:', isAutoMode);
      
      setDeviceStatus({
        pump: isPumpAuto,
        pumpMode: pumpMode,
        pumpStatus: pumpStatus,
        autoMode: isAutoMode,
        lampMode: lampMode,
        lampStatus: lampStatus,
      });
    } catch (error) {
      console.error('Error fetching device status:', error);
      // Keep current status or set default
      setDeviceStatus(prev => prev);
    }
  };

  // Control pump using setPump method - toggle (chỉ gửi state: true)
  const handlePumpControl = async () => {
    try {
      setLoading(true);
      setMessage('');
      const deviceId = currentDeviceId || getDeviceId();
      
      console.log('handlePumpControl called, deviceId:', deviceId);
      
      if (!deviceId) {
        setMessage('Không tìm thấy deviceId. Vui lòng tải lại trang.');
        setLoading(false);
        return;
      }
      
      const method = 'setPump';
      const params = { state: true }; // Chỉ gửi state: true để toggle chế độ máy bơm
      
      console.log('Sending RPC:', { deviceId, method, params });
      
      // Use the correct RPC endpoint: /api/rpc/oneway/{deviceId}
      // with payload: { method, params, persistent: false, timeout: 5000 }
      const response = await deviceAPI.sendRPC(deviceId, method, params, false, 5000);
      
      console.log('RPC response:', response);
      setMessage('Đã gửi lệnh toggle chế độ máy bơm');
      
      // Refresh status immediately and then again after delay to ensure update
      fetchDeviceStatus();
      setTimeout(() => {
        fetchDeviceStatus();
      }, 2000);
      setTimeout(() => {
        fetchDeviceStatus();
      }, 4000);
    } catch (error) {
      console.error('Error controlling pump:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setMessage('Lỗi khi điều khiển máy bơm: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Control auto mode using setLamp method - toggle (chỉ gửi state: true)
  const handleAutoModeControl = async () => {
    try {
      setLoading(true);
      setMessage('');
      const deviceId = currentDeviceId || getDeviceId();
      
      console.log('handleAutoModeControl called, deviceId:', deviceId);
      
      if (!deviceId) {
        setMessage('Không tìm thấy deviceId. Vui lòng tải lại trang.');
        setLoading(false);
        return;
      }
      
      const method = 'setLamp';
      const params = { state: true }; // Chỉ gửi state: true để toggle chế độ tự động
      
      console.log('Sending RPC:', { deviceId, method, params });
      
      // Use the correct RPC endpoint: /api/rpc/oneway/{deviceId}
      // with payload: { method, params, persistent: false, timeout: 5000 }
      const response = await deviceAPI.sendRPC(deviceId, method, params, false, 5000);
      
      console.log('RPC response:', response);
      setMessage('Đã gửi lệnh toggle chế độ tự động');
      
      // Refresh status immediately and then again after delay to ensure update
      fetchDeviceStatus();
      setTimeout(() => {
        fetchDeviceStatus();
      }, 2000);
      setTimeout(() => {
        fetchDeviceStatus();
      }, 4000);
    } catch (error) {
      console.error('Error controlling auto mode:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setMessage('Lỗi khi điều khiển chế độ tự động: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
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
              <p className="text-sm text-gray-600 mt-1">Bật/tắt chế độ tự động</p>
            </div>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              deviceStatus.pump ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              <span className="text-white font-bold text-sm text-center px-1">
                {deviceStatus.pumpMode}
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handlePumpControl}
              disabled={loading}
              className={`w-full py-4 px-4 rounded-lg font-semibold transition-all ${
                deviceStatus.pump
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
                deviceStatus.pump ? 'TẮT chế độ tự động' : 'BẬT chế độ tự động'
              )}
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Chế độ:</strong> <span className="font-semibold">{deviceStatus.pumpMode}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Trạng thái:</strong> <span className={`font-semibold ${deviceStatus.pumpStatus === 'ON' ? 'text-green-600' : 'text-gray-600'}`}>
                {deviceStatus.pumpStatus === 'ON' ? 'BẬT' : 'TẮT'}
              </span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Chức năng:</strong> {deviceStatus.pump 
                ? 'Hệ thống tự động điều khiển máy bơm theo ngưỡng đã cài đặt'
                : 'Điều khiển máy bơm thủ công'}
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
              <strong>Chế độ:</strong> <span className="font-semibold">{deviceStatus.lampMode}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Trạng thái:</strong> <span className={`font-semibold ${deviceStatus.lampStatus === 'ON' ? 'text-green-600' : 'text-gray-600'}`}>
                {deviceStatus.lampStatus === 'ON' ? 'BẬT' : 'TẮT'}
              </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Máy bơm nước</p>
            <div className="mt-2 space-y-1">
              <p className={`text-2xl font-bold ${
                deviceStatus.pump ? 'text-green-600' : 'text-blue-600'
              }`}>
                {deviceStatus.pumpMode}
              </p>
              <p className={`text-sm font-medium ${
                deviceStatus.pumpStatus === 'ON' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {deviceStatus.pumpStatus === 'ON' ? '● BẬT' : '○ TẮT'}
              </p>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Đèn</p>
            <div className="mt-2 space-y-1">
              <p className={`text-2xl font-bold ${
                deviceStatus.autoMode ? 'text-green-600' : 'text-blue-600'
              }`}>
                {deviceStatus.lampMode}
              </p>
              <p className={`text-sm font-medium ${
                deviceStatus.lampStatus === 'ON' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {deviceStatus.lampStatus === 'ON' ? '● BẬT' : '○ TẮT'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceControl;


