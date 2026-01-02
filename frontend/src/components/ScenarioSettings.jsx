import { useState, useEffect } from 'react';
import { scenarioAPI } from '../services/api';
import { DEVICE_CONFIG, getDeviceId } from '../config/deviceConfig';

const ScenarioSettings = () => {
  const [thresholds, setThresholds] = useState({
    soilMoistureMin: 30,
    soilMoistureMax: 80,
    temperatureMin: 18,
    temperatureMax: 30,
    humidityMin: 40,
    humidityMax: 80,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const deviceId = getDeviceId();
      const entityType = DEVICE_CONFIG.entityType;
      
      const response = await scenarioAPI.getThresholds(entityType, deviceId);
      
      if (response.data) {
        // ThingsBoard returns attributes as an object
        const attrs = response.data;
        setThresholds({
          soilMoistureMin: attrs.soilMoistureMin || 30,
          soilMoistureMax: attrs.soilMoistureMax || 80,
          temperatureMin: attrs.temperatureMin || 18,
          temperatureMax: attrs.temperatureMax || 30,
          humidityMin: attrs.humidityMin || 40,
          humidityMax: attrs.humidityMax || 80,
        });
      }
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      // Keep default values
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setThresholds(prev => ({
      ...prev,
      [field]: Number(value),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      const deviceId = getDeviceId();
      const entityType = DEVICE_CONFIG.entityType;
      
      await scenarioAPI.updateThresholds(entityType, deviceId, thresholds);
      setMessage('Đã lưu cài đặt kịch bản thành công!');
    } catch (error) {
      console.error('Error saving thresholds:', error);
      setMessage('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReset = () => {
    setThresholds({
      soilMoistureMin: 30,
      soilMoistureMax: 80,
      temperatureMin: 18,
      temperatureMax: 30,
      humidityMin: 40,
      humidityMax: 80,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Cài đặt kịch bản</h1>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Đặt lại
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Lỗi') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Soil Moisture Thresholds */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Ngưỡng độ ẩm đất
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Khi độ ẩm đất vượt ngoài khoảng này, hệ thống sẽ tự động tưới nước hoặc cảnh báo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng dưới (Tối thiểu) - %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.soilMoistureMin}
                  onChange={(e) => handleInputChange('soilMoistureMin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu độ ẩm đất &lt; {thresholds.soilMoistureMin}%, máy bơm sẽ tự động bật
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng trên (Tối đa) - %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.soilMoistureMax}
                  onChange={(e) => handleInputChange('soilMoistureMax', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu độ ẩm đất &gt; {thresholds.soilMoistureMax}%, hệ thống sẽ cảnh báo
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Khoảng hoạt động:</strong> {thresholds.soilMoistureMin}% - {thresholds.soilMoistureMax}%
              </p>
            </div>
          </div>

          {/* Temperature Thresholds */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Ngưỡng nhiệt độ không khí
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Khi nhiệt độ vượt ngoài khoảng này, hệ thống sẽ tự động bật đèn sưởi hoặc cảnh báo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng dưới (Tối thiểu) - °C
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={thresholds.temperatureMin}
                  onChange={(e) => handleInputChange('temperatureMin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu nhiệt độ &lt; {thresholds.temperatureMin}°C, đèn sưởi sẽ tự động bật
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng trên (Tối đa) - °C
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={thresholds.temperatureMax}
                  onChange={(e) => handleInputChange('temperatureMax', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu nhiệt độ &gt; {thresholds.temperatureMax}°C, hệ thống sẽ cảnh báo
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Khoảng hoạt động:</strong> {thresholds.temperatureMin}°C - {thresholds.temperatureMax}°C
              </p>
            </div>
          </div>

          {/* Humidity Thresholds */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
              Ngưỡng độ ẩm không khí
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Khi độ ẩm không khí vượt ngoài khoảng này, hệ thống sẽ cảnh báo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng dưới (Tối thiểu) - %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.humidityMin}
                  onChange={(e) => handleInputChange('humidityMin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu độ ẩm &lt; {thresholds.humidityMin}%, hệ thống sẽ cảnh báo
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng trên (Tối đa) - %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.humidityMax}
                  onChange={(e) => handleInputChange('humidityMax', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu độ ẩm &gt; {thresholds.humidityMax}%, hệ thống sẽ cảnh báo
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Khoảng hoạt động:</strong> {thresholds.humidityMin}% - {thresholds.humidityMax}%
              </p>
            </div>
          </div>

          {/* Alert Information */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Lưu ý:</strong> Khi giá trị cảm biến vượt ngoài các ngưỡng đã cài đặt, hệ thống sẽ:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li>Tự động kích hoạt thiết bị (máy bơm hoặc đèn sưởi) nếu cần</li>
                  <li>Gửi thông báo cảnh báo về sự bất thường của môi trường</li>
                  <li>Ghi lại log để theo dõi và phân tích</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioSettings;


