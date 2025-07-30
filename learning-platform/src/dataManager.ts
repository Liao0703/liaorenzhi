// 数据管理工具
import { getAllArticles } from './articleData';
import { getAllPhotos, getPhotoStats } from './photoStorage';
import { getSettings } from './settingsStorage';

export interface SystemData {
  articles: any[];
  photos: any[];
  settings: any;
  stats: {
    totalArticles: number;
    totalPhotos: number;
    todayPhotos: number;
    storageSize: string;
  };
}

// 获取系统所有数据
export const getAllSystemData = (): SystemData => {
  const articles = getAllArticles();
  const photos = getAllPhotos();
  const settings = getSettings();
  const photoStats = getPhotoStats();
  
  // 计算存储大小
  const calculateStorageSize = () => {
    try {
      const articlesSize = JSON.stringify(articles).length;
      const photosSize = JSON.stringify(photos).length;
      const settingsSize = JSON.stringify(settings).length;
      const totalSize = articlesSize + photosSize + settingsSize;
      
      if (totalSize < 1024) {
        return `${totalSize} B`;
      } else if (totalSize < 1024 * 1024) {
        return `${(totalSize / 1024).toFixed(2)} KB`;
      } else {
        return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
      }
    } catch (error) {
      return '未知';
    }
  };
  
  return {
    articles,
    photos,
    settings,
    stats: {
      totalArticles: articles.length,
      totalPhotos: photoStats.totalPhotos,
      todayPhotos: photoStats.todayPhotos,
      storageSize: calculateStorageSize()
    }
  };
};

// 导出所有数据为JSON
export const exportAllData = (): string => {
  const data = getAllSystemData();
  return JSON.stringify(data, null, 2);
};

// 清空所有数据
export const clearAllData = () => {
  try {
    // 清空localStorage中的所有学习相关数据
    localStorage.removeItem('learning_articles');
    localStorage.removeItem('learning_photos');
    localStorage.removeItem('learning_settings');
    
    // 重新加载页面以应用更改
    window.location.reload();
  } catch (error) {
    console.error('清空数据失败:', error);
  }
};

// 备份数据
export const backupData = () => {
  const data = exportAllData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `学习系统备份_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 恢复数据
export const restoreData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.articles) {
      localStorage.setItem('learning_articles', JSON.stringify(data.articles));
    }
    
    if (data.photos) {
      localStorage.setItem('learning_photos', JSON.stringify(data.photos));
    }
    
    if (data.settings) {
      localStorage.setItem('learning_settings', JSON.stringify(data.settings));
    }
    
    // 重新加载页面以应用更改
    window.location.reload();
    return true;
  } catch (error) {
    console.error('恢复数据失败:', error);
    return false;
  }
}; 