import { useState, useEffect } from 'react';
import { deviceAPI, sensorAPI } from '../services/api';
import { DEVICE_CONFIG, getDeviceId } from '../config/deviceConfig';

const DeviceControl = () => {
  const [deviceStatus, setDeviceStatus] = useState({
    pump: false,
    heater: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDeviceStatus();
    const interval = setInterval(fetchDeviceStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      const deviceId = getDeviceId();
      const entityType = DEVICE_CONFIG.entityType;
      
      // Get device status from telemetry (pumpStatus, heaterStatus)
      const keys = [
        DEVICE_CONFIG.telemetryKeys.pumpStatus,
        DEVICE_CONFIG.telemetryKeys.heaterStatus,
      ];
      
      const response = await sensorAPI.getLatestTelemetry(entityType, deviceId, keys);
      const data = response.data || {};
      
      // Extract status values (assuming boolean or 'on'/'off' string)
      const pumpValue = data[DEVICE_CONFIG.telemetryKeys.pumpStatus]?.[0]?.value;
      const heaterValue = data[DEVICE_CONFIG.telemetryKeys.heaterStatus]?.[0]?.value;
      
      setDeviceStatus({
        pump: pumpValue === true || pumpValue === 'on' || pumpValue === 1,
        heater: heaterValue === true || heaterValue === 'on' || heaterValue === 1,
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
      const deviceId = getDeviceId();
      const method = DEVICE_CONFIG.rpcMethods.setPump;
      const params = { action }; // { action: 'on' } or { action: 'off' }
      
      await deviceAPI.sendRPC(deviceId, method, params);
      setMessage(`Máy bơm đã được ${action === 'on' ? 'BẬT' : 'TẮT'}`);
      
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchDeviceStatus();
      }, 1000);
    } catch (error) {
      console.error('Error controlling pump:', error);
      setMessage('Lỗi khi điều khiển máy bơm');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleHeaterControl = async (action) => {
    try {
      setLoading(true);
      setMessage('');
      const deviceId = getDeviceId();
      const method = DEVICE_CONFIG.rpcMethods.setHeater;
      const params = { action }; // { action: 'on' } or { action: 'off' }
      
      await deviceAPI.sendRPC(deviceId, method, params);
      setMessage(`Đèn sưởi đã được ${action === 'on' ? 'BẬT' : 'TẮT'}`);
      
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchDeviceStatus();
      }, 1000);
    } catch (error) {
      console.error('Error controlling heater:', error);
      setMessage('Lỗi khi điều khiển đèn sưởi');
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

        {/* Heater Lamp Control */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Đèn sưởi cây</h2>
              <p className="text-sm text-gray-600 mt-1">Điều khiển đèn sưởi giữ ấm</p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              deviceStatus.heater ? 'bg-orange-500' : 'bg-gray-300'
            }`}>
              <span className="text-white font-bold text-xl">
                {deviceStatus.heater ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={() => handleHeaterControl('on')}
              disabled={loading || deviceStatus.heater}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                deviceStatus.heater
                  ? 'bg-orange-500 text-white cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {deviceStatus.heater ? 'Đang BẬT' : 'BẬT đèn sưởi'}
            </button>
            <button
              onClick={() => handleHeaterControl('off')}
              disabled={loading || !deviceStatus.heater}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                !deviceStatus.heater
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!deviceStatus.heater ? 'Đang TẮT' : 'TẮT đèn sưởi'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Trạng thái:</strong> {deviceStatus.heater ? 'Đang hoạt động' : 'Đã tắt'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Chức năng:</strong> Sưởi ấm tự động khi nhiệt độ thấp
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
            <p className="text-sm text-gray-600">Đèn sưởi cây</p>
            <p className={`text-2xl font-bold mt-2 ${
              deviceStatus.heater ? 'text-orange-600' : 'text-gray-400'
            }`}>
              {deviceStatus.heater ? 'BẬT' : 'TẮT'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceControl;


