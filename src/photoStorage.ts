// 照片存储管理
export interface PhotoRecord {
  id: string;
  timestamp: string;
  photoData: string;
  articleId: string;
  articleTitle: string;
  userId?: string;
  userName?: string;
}

// 模拟照片存储（实际项目中应该使用数据库）
let photoStorage: PhotoRecord[] = [];

// 从localStorage加载照片数据
const loadPhotosFromStorage = () => {
  try {
    const stored = localStorage.getItem('learning_photos');
    if (stored) {
      photoStorage = JSON.parse(stored);
    }
  } catch (error) {
    console.error('加载照片数据失败:', error);
  }
};

// 保存照片数据到localStorage
const savePhotosToStorage = () => {
  try {
    localStorage.setItem('learning_photos', JSON.stringify(photoStorage));
  } catch (error) {
    console.error('保存照片数据失败:', error);
  }
};

// 初始化时加载数据
loadPhotosFromStorage();

// 保存照片
export const savePhoto = (photoData: string, articleId: string, articleTitle: string, userId?: string, userName?: string): PhotoRecord => {
  const photoRecord: PhotoRecord = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    photoData,
    articleId,
    articleTitle,
    userId,
    userName
  };
  
  photoStorage.push(photoRecord);
  
  // 限制存储数量，避免内存溢出（保留最近1000张照片）
  if (photoStorage.length > 1000) {
    photoStorage = photoStorage.slice(-1000);
  }
  
  // 保存到localStorage
  savePhotosToStorage();
  
  return photoRecord;
};

// 获取所有照片
export const getAllPhotos = (): PhotoRecord[] => {
  return [...photoStorage];
};

// 根据文章ID获取照片
export const getPhotosByArticleId = (articleId: string): PhotoRecord[] => {
  return photoStorage.filter(photo => photo.articleId === articleId);
};

// 根据用户ID获取照片
export const getPhotosByUserId = (userId: string): PhotoRecord[] => {
  return photoStorage.filter(photo => photo.userId === userId);
};

// 删除照片
export const deletePhoto = (photoId: string): boolean => {
  const index = photoStorage.findIndex(photo => photo.id === photoId);
  if (index !== -1) {
    photoStorage.splice(index, 1);
    savePhotosToStorage();
    return true;
  }
  return false;
};

// 清空所有照片
export const clearAllPhotos = (): void => {
  photoStorage = [];
  savePhotosToStorage();
};

// 获取照片统计信息
export const getPhotoStats = () => {
  const totalPhotos = photoStorage.length;
  const today = new Date().toDateString();
  const todayPhotos = photoStorage.filter(photo => 
    new Date(photo.timestamp).toDateString() === today
  ).length;
  
  const articleStats = photoStorage.reduce((acc, photo) => {
    acc[photo.articleTitle] = (acc[photo.articleTitle] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalPhotos,
    todayPhotos,
    articleStats
  };
};

// 导出照片数据为JSON
export const exportPhotoData = (): string => {
  return JSON.stringify(photoStorage, null, 2);
};

// 导入照片数据
export const importPhotoData = (data: string): boolean => {
  try {
    const importedPhotos = JSON.parse(data);
    if (Array.isArray(importedPhotos)) {
      photoStorage = importedPhotos;
      savePhotosToStorage();
      return true;
    }
    return false;
  } catch (error) {
    console.error('导入照片数据失败:', error);
    return false;
  }
}; 