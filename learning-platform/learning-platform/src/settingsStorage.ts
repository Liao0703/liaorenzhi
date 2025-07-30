// 系统设置存储管理
export interface SystemSettings {
  cameraInterval: number; // 摄像头拍照间隔（秒）
  defaultReadingTime: number; // 默认阅读时间（分钟）
  maxPhotos: number; // 最大照片存储数量
}

// 默认设置
const defaultSettings: SystemSettings = {
  cameraInterval: 30,
  defaultReadingTime: 30,
  maxPhotos: 1000
};

// 从localStorage加载设置
const loadSettingsFromStorage = (): SystemSettings => {
  try {
    const stored = localStorage.getItem('learning_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      // 合并默认设置，确保所有字段都存在
      return { ...defaultSettings, ...settings };
    }
  } catch (error) {
    console.error('加载系统设置失败:', error);
  }
  return defaultSettings;
};

// 保存设置到localStorage
const saveSettingsToStorage = (settings: SystemSettings) => {
  try {
    localStorage.setItem('learning_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('保存系统设置失败:', error);
  }
};

// 当前设置
let currentSettings: SystemSettings = loadSettingsFromStorage();

// 获取当前设置
export const getSettings = (): SystemSettings => {
  return { ...currentSettings };
};

// 更新设置
export const updateSettings = (newSettings: Partial<SystemSettings>) => {
  currentSettings = { ...currentSettings, ...newSettings };
  saveSettingsToStorage(currentSettings);
};

// 重置为默认设置
export const resetSettings = () => {
  currentSettings = { ...defaultSettings };
  saveSettingsToStorage(currentSettings);
};

// 获取特定设置项
export const getSetting = <K extends keyof SystemSettings>(key: K): SystemSettings[K] => {
  return currentSettings[key];
};

// 设置特定设置项
export const setSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
  currentSettings[key] = value;
  saveSettingsToStorage(currentSettings);
}; 