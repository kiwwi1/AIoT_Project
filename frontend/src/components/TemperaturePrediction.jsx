import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { predictionAPI } from '../services/api';
import { DEVICE_CONFIG, getDeviceId } from '../config/deviceConfig';

const TemperaturePrediction = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const deviceId = getDeviceId();
      const entityType = DEVICE_CONFIG.entityType;
      
      const response = await predictionAPI.getPredictions(entityType, deviceId);
      
      if (response.data) {
        const processed = processPredictions(response.data);
        setPredictions(processed);
      } else {
        setPredictions(generateMockPredictions());
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      // Mock data for development
      setPredictions(generateMockPredictions());
    } finally {
      setLoading(false);
    }
  };

  // Process predictions from telemetry data
  const processPredictions = (data) => {
    const predictionKey = DEVICE_CONFIG.telemetryKeys.temperaturePrediction;
    const predictionData = data[predictionKey] || [];
    
    // Also get actual temperature for comparison
    const actualTempKey = DEVICE_CONFIG.telemetryKeys.airTemperature;
    const actualData = data[actualTempKey] || [];
    
    const processed = [];
    const now = new Date();
    
    // Process prediction data (assuming it contains future predictions)
    predictionData.forEach((point, index) => {
      const date = new Date(point.ts);
      const actualPoint = actualData.find(p => Math.abs(p.ts - point.ts) < 3600000); // Within 1 hour
      
      processed.push({
        hour: date.getHours(),
        time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        predicted: point.value?.toFixed(1) || null,
        actual: actualPoint?.value?.toFixed(1) || null,
      });
    });
    
    // If no predictions, generate mock
    if (processed.length === 0) {
      return generateMockPredictions();
    }
    
    return processed;
  };

  const generateMockPredictions = () => {
    const data = [];
    const now = new Date();
    const currentTemp = 25;
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getTime() + i * 60 * 60 * 1000);
      const predicted = currentTemp + (Math.random() * 4 - 2) + (i * 0.1);
      data.push({
        hour: date.getHours(),
        time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        predicted: predicted.toFixed(1),
        actual: i === 0 ? currentTemp.toFixed(1) : null,
      });
    }
    return data;
  };

  const latestPrediction = predictions.length > 0 ? predictions[0] : null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dự báo nhiệt độ môi trường</h1>

      {latestPrediction && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg shadow-md text-white">
          <h2 className="text-xl font-semibold mb-2">Dự báo nhiệt độ tiếp theo</h2>
          <p className="text-4xl font-bold">{latestPrediction.predicted}°C</p>
          <p className="text-sm mt-2 opacity-90">
            Thời gian: {latestPrediction.time}
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Biểu đồ dự báo nhiệt độ (24 giờ tiếp theo)
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(predictions.length / 8)}
              />
              <YAxis label={{ value: 'Nhiệt độ (°C)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Dự báo (°C)"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              {predictions.some(p => p.actual) && (
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Thực tế (°C)"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bảng dự báo chi tiết</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự báo (°C)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thực tế (°C)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu dự báo
                  </td>
                </tr>
              ) : (
                predictions.map((pred, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pred.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                      {pred.predicted}°C
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pred.actual ? `${pred.actual}°C` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Thông tin:</strong> Dự báo được tạo bởi mô hình LSTM trên ESP32 sử dụng TinyML và Edge Impulse.
          Mô hình phân tích dữ liệu nhiệt độ và độ ẩm hiện tại để dự đoán xu hướng nhiệt độ trong 24 giờ tiếp theo.
        </p>
      </div>
    </div>
  );
};

export default TemperaturePrediction;


