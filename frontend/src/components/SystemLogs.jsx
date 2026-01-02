import { useState, useEffect } from 'react';
import { logAPI } from '../services/api';

const SystemLogs = () => {
  const [logs, setLogs] = useState({
    sensors: [],
    devices: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sensors');
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    fetchLogs();
  }, [activeTab, timeRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let response;
      switch (activeTab) {
        case 'sensors':
          response = await logAPI.getSensorLogs(timeRange);
          setLogs(prev => ({ ...prev, sensors: response.data || [] }));
          break;
        case 'devices':
          response = await logAPI.getDeviceLogs(timeRange);
          setLogs(prev => ({ ...prev, devices: response.data || [] }));
          break;
        case 'users':
          response = await logAPI.getUserLogs(timeRange);
          setLogs(prev => ({ ...prev, users: response.data || [] }));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Mock data for development
      setLogs(prev => ({
        ...prev,
        [activeTab]: generateMockLogs(activeTab),
      }));
    } finally {
      setLoading(false);
    }
  };

  const generateMockLogs = (type) => {
    const logs = [];
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const date = new Date(now.getTime() - i * 30 * 60 * 1000);
      let log;
      switch (type) {
        case 'sensors':
          log = {
            id: i + 1,
            timestamp: date.toISOString(),
            time: date.toLocaleTimeString('vi-VN'),
            date: date.toLocaleDateString('vi-VN'),
            soilMoisture: Math.floor(Math.random() * 40) + 30,
            airTemperature: (Math.random() * 15 + 20).toFixed(1),
            airHumidity: Math.floor(Math.random() * 30) + 50,
          };
          break;
        case 'devices':
          log = {
            id: i + 1,
            timestamp: date.toISOString(),
            time: date.toLocaleTimeString('vi-VN'),
            date: date.toLocaleDateString('vi-VN'),
            device: i % 2 === 0 ? 'pump' : 'heater',
            action: i % 3 === 0 ? 'on' : 'off',
            status: i % 3 === 0 ? 'success' : 'info',
          };
          break;
        case 'users':
          log = {
            id: i + 1,
            timestamp: date.toISOString(),
            time: date.toLocaleTimeString('vi-VN'),
            date: date.toLocaleDateString('vi-VN'),
            command: i % 2 === 0 ? 'pump_on' : 'heater_off',
            user: 'admin',
            result: 'success',
          };
          break;
        default:
          log = {};
      }
      logs.push(log);
    }
    return logs;
  };

  const getLogTable = () => {
    const currentLogs = logs[activeTab] || [];

    switch (activeTab) {
      case 'sensors':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ ẩm đất (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhiệt độ (°C)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ ẩm không khí (%)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.date} {log.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.soilMoisture}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.airTemperature}°C</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.airHumidity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'devices':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thiết bị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.date} {log.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.device === 'pump' ? 'Máy bơm nước' : 'Đèn sưởi cây'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      log.action === 'on' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action === 'on' ? 'BẬT' : 'TẮT'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      log.status === 'success' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status === 'success' ? 'Thành công' : 'Thông tin'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'users':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lệnh điều khiển</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.date} {log.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.command === 'pump_on' ? 'Bật máy bơm' :
                     log.command === 'pump_off' ? 'Tắt máy bơm' :
                     log.command === 'heater_on' ? 'Bật đèn sưởi' :
                     log.command === 'heater_off' ? 'Tắt đèn sưởi' : log.command}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      log.result === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.result === 'success' ? 'Thành công' : 'Thất bại'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Log hệ thống</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>1 ngày</option>
          <option value={3}>3 ngày</option>
          <option value={7}>7 ngày</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('sensors')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sensors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Log cảm biến
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'devices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Log thiết bị
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Log người dùng
            </button>
          </nav>
        </div>

        {/* Table */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {getLogTable()}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Lưu ý:</strong> Hệ thống tự động xóa log sau 7 ngày để tối ưu dung lượng lưu trữ.
        </p>
      </div>
    </div>
  );
};

export default SystemLogs;


