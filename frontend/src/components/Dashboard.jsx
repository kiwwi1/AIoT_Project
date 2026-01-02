import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { sensorAPI } from '../services/api';
import { DEVICE_CONFIG, getDeviceId } from '../config/deviceConfig';

const Dashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // days

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchSensorData = async () => {
    try {
      setLoading(true);
      const deviceId = getDeviceId();
      const entityType = DEVICE_CONFIG.entityType;
      const keys = [
        DEVICE_CONFIG.telemetryKeys.soilMoisture,
        DEVICE_CONFIG.telemetryKeys.airTemperature,
        DEVICE_CONFIG.telemetryKeys.airHumidity,
      ];

      // Calculate time range
      const endTs = Date.now();
      const startTs = endTs - (timeRange * 24 * 60 * 60 * 1000);

      // Get latest values
      const latestResponse = await sensorAPI.getLatestTelemetry(entityType, deviceId, keys);
      
      // Get history
      const historyResponse = await sensorAPI.getTelemetryHistory(
        entityType,
        deviceId,
        keys,
        startTs,
        endTs,
        3600000 // 1 hour interval
      );

      // Process latest data
      if (latestResponse.data) {
        const latest = processLatestTelemetry(latestResponse.data);
        setLatestData(latest);
      }

      // Process history data
      if (historyResponse.data) {
        const processed = processTelemetryHistory(historyResponse.data, keys);
        setSensorData(processed);
      } else {
        setSensorData(generateMockData());
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      // Mock data for development
      const mockData = generateMockData();
      setSensorData(mockData);
      setLatestData(mockData.length > 0 ? mockData[mockData.length - 1] : null);
    } finally {
      setLoading(false);
    }
  };

  // Process latest telemetry data from ThingsBoard format
  const processLatestTelemetry = (data) => {
    const now = new Date();
    return {
      soilMoisture: data[DEVICE_CONFIG.telemetryKeys.soilMoisture]?.[0]?.value || 0,
      airTemperature: data[DEVICE_CONFIG.telemetryKeys.airTemperature]?.[0]?.value || 0,
      airHumidity: data[DEVICE_CONFIG.telemetryKeys.airHumidity]?.[0]?.value || 0,
      time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('vi-VN'),
    };
  };

  // Process telemetry history data from ThingsBoard format
  const processTelemetryHistory = (data, keys) => {
    const processed = [];
    const soilMoisture = data[DEVICE_CONFIG.telemetryKeys.soilMoisture] || [];
    const airTemperature = data[DEVICE_CONFIG.telemetryKeys.airTemperature] || [];
    const airHumidity = data[DEVICE_CONFIG.telemetryKeys.airHumidity] || [];

    // Get all timestamps
    const allTimestamps = new Set();
    [soilMoisture, airTemperature, airHumidity].forEach(series => {
      series.forEach(point => allTimestamps.add(point.ts));
    });

    // Combine data by timestamp
    Array.from(allTimestamps).sort().forEach(ts => {
      const date = new Date(ts);
      const soilPoint = soilMoisture.find(p => p.ts === ts);
      const tempPoint = airTemperature.find(p => p.ts === ts);
      const humidityPoint = airHumidity.find(p => p.ts === ts);

      processed.push({
        timestamp: ts,
        time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString('vi-VN'),
        soilMoisture: soilPoint?.value || null,
        airTemperature: tempPoint?.value || null,
        airHumidity: humidityPoint?.value || null,
      });
    });

    return processed;
  };

  const generateMockData = () => {
    const data = [];
    const now = new Date();
    for (let i = timeRange * 24 - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: date.toISOString(),
        time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString('vi-VN'),
        soilMoisture: Math.floor(Math.random() * 40) + 30,
        airTemperature: (Math.random() * 15 + 20).toFixed(1),
        airHumidity: Math.floor(Math.random() * 30) + 50,
      });
    }
    return data;
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard - Thống kê dữ liệu</h1>
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

      {/* Current Status Cards */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Độ ẩm đất</h3>
            <p className="text-3xl font-bold text-blue-600">{latestData.soilMoisture}%</p>
            <p className="text-xs text-gray-500 mt-1">Cập nhật: {latestData.time}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Nhiệt độ không khí</h3>
            <p className="text-3xl font-bold text-green-600">{latestData.airTemperature}°C</p>
            <p className="text-xs text-gray-500 mt-1">Cập nhật: {latestData.time}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Độ ẩm không khí</h3>
            <p className="text-3xl font-bold text-purple-600">{latestData.airHumidity}%</p>
            <p className="text-xs text-gray-500 mt-1">Cập nhật: {latestData.time}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Độ ẩm đất theo thời gian</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(sensorData.length / 10)}
                />
                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Độ ẩm đất (%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Air Temperature Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Nhiệt độ không khí theo thời gian</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(sensorData.length / 10)}
                />
                <YAxis label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="airTemperature" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Nhiệt độ (°C)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Air Humidity Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Độ ẩm không khí theo thời gian</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(sensorData.length / 10)}
                />
                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="airHumidity" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Độ ẩm (%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Combined Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Tổng hợp dữ liệu</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(sensorData.length / 10)}
                />
                <YAxis yAxisId="left" label={{ value: 'Nhiệt độ (°C)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Độ ẩm (%)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="airTemperature" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Nhiệt độ (°C)"
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="airHumidity" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Độ ẩm không khí (%)"
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Độ ẩm đất (%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bảng dữ liệu chi tiết</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Độ ẩm đất (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhiệt độ (°C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Độ ẩm không khí (%)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : sensorData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                sensorData.slice().reverse().map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.date} {data.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.soilMoisture}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.airTemperature}°C
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.airHumidity}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


