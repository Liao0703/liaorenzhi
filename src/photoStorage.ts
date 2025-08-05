// 照片存储管理
export interface PhotoRecord {
  id: string;
  timestamp: string;
  photoData: string;
  articleId: string;
  articleTitle: string;
  userId?: string;
  userName?: string;
  readingTime?: number; // 阅读时长（分钟）
  quizScore?: number; // 答题成绩
  learningStatus: 'reading' | 'completed' | 'failed'; // 学习状态
}

// 用户学习记录接口
export interface UserLearningRecord {
  userId: string;
  userName: string;
  articleId: string;
  articleTitle: string;
  readingTime: number;
  quizScore: number;
  photos: PhotoRecord[];
  completedAt: string;
  status: 'completed' | 'failed';
}

// 模拟照片存储（实际项目中应该使用数据库）
let photoStorage: PhotoRecord[] = [];
let userLearningRecords: UserLearningRecord[] = [];

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

// 从localStorage加载用户学习记录
const loadLearningRecordsFromStorage = () => {
  try {
    const stored = localStorage.getItem('learning_records');
    if (stored) {
      userLearningRecords = JSON.parse(stored);
    }
  } catch (error) {
    console.error('加载学习记录失败:', error);
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

// 保存学习记录到localStorage
const saveLearningRecordsToStorage = () => {
  try {
    localStorage.setItem('learning_records', JSON.stringify(userLearningRecords));
  } catch (error) {
    console.error('保存学习记录失败:', error);
  }
};

// 初始化时加载数据
loadPhotosFromStorage();
loadLearningRecordsFromStorage();

// 保存照片
export const savePhoto = (
  photoData: string, 
  articleId: string, 
  articleTitle: string, 
  userId?: string, 
  userName?: string,
  readingTime?: number,
  quizScore?: number,
  learningStatus: 'reading' | 'completed' | 'failed' = 'reading'
): PhotoRecord => {
  const photoRecord: PhotoRecord = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    photoData,
    articleId,
    articleTitle,
    userId,
    userName,
    readingTime,
    quizScore,
    learningStatus
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

// 保存用户学习记录
export const saveUserLearningRecord = (
  userId: string,
  userName: string,
  articleId: string,
  articleTitle: string,
  readingTime: number,
  quizScore: number,
  photos: PhotoRecord[],
  status: 'completed' | 'failed' = 'completed'
): UserLearningRecord => {
  const record: UserLearningRecord = {
    userId,
    userName,
    articleId,
    articleTitle,
    readingTime,
    quizScore,
    photos,
    completedAt: new Date().toISOString(),
    status
  };
  
  // 检查是否已存在相同记录，如果存在则更新
  const existingIndex = userLearningRecords.findIndex(
    r => r.userId === userId && r.articleId === articleId
  );
  
  if (existingIndex !== -1) {
    userLearningRecords[existingIndex] = record;
  } else {
    userLearningRecords.push(record);
  }
  
  saveLearningRecordsToStorage();
  return record;
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

// 获取用户学习记录
export const getUserLearningRecords = (userId?: string): UserLearningRecord[] => {
  if (userId) {
    return userLearningRecords.filter(record => record.userId === userId);
  }
  return [...userLearningRecords];
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

// 将Base64照片转换为JPG格式并下载
export const exportPhotoAsJPG = (photoRecord: PhotoRecord, fileName?: string): void => {
  try {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 设置canvas尺寸
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图片到canvas
      ctx?.drawImage(img, 0, 0);
      
      // 转换为JPG格式
      canvas.toBlob((blob) => {
        if (blob) {
          // 创建下载链接
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName || `photo_${photoRecord.id}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', 0.9); // 0.9是JPG质量
    };
    
    img.src = photoRecord.photoData;
  } catch (error) {
    console.error('导出照片失败:', error);
    alert('导出照片失败');
  }
};

// 批量导出用户照片为JPG
export const exportUserPhotosAsJPG = (userId: string, userName: string): void => {
  const userPhotos = getPhotosByUserId(userId);
  // const userRecords = getUserLearningRecords(userId);
  
  if (userPhotos.length === 0) {
    alert('该用户没有照片记录');
    return;
  }
  
  // 创建ZIP文件（如果支持JSZip）
  if (typeof window !== 'undefined' && (window as any).JSZip) {
    const JSZip = (window as any).JSZip;
    const zip = new JSZip();
    
    // 添加照片到ZIP
    userPhotos.forEach((photo, index) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `${userName}_${photo.articleTitle}_${new Date(photo.timestamp).toLocaleDateString()}.jpg`;
            zip.file(fileName, blob);
            
            // 当所有照片都添加完成后，下载ZIP
            if (index === userPhotos.length - 1) {
              zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${userName}_学习照片_${new Date().toLocaleDateString()}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.src = photo.photoData;
    });
  } else {
    // 如果不支持ZIP，逐个下载
    userPhotos.forEach((photo, index) => {
      setTimeout(() => {
        const fileName = `${userName}_${photo.articleTitle}_${new Date(photo.timestamp).toLocaleDateString()}.jpg`;
        exportPhotoAsJPG(photo, fileName);
      }, index * 100); // 延迟下载，避免浏览器阻止
    });
  }
};

// 导出用户学习记录报告
export const exportUserLearningReport = (userId: string, userName: string): void => {
  const userRecords = getUserLearningRecords(userId);
  
  if (userRecords.length === 0) {
    alert('该用户没有学习记录');
    return;
  }
  
  // 生成CSV格式的报告
  const csvContent = [
    ['用户姓名', '文章标题', '阅读时长(分钟)', '答题成绩', '完成时间', '学习状态'],
    ...userRecords.map(record => [
      record.userName,
      record.articleTitle,
      record.readingTime.toString(),
      record.quizScore.toString(),
      new Date(record.completedAt).toLocaleString(),
      record.status === 'completed' ? '已完成' : '未完成'
    ])
  ].map(row => row.join(',')).join('\n');
  
  // 下载CSV文件
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${userName}_学习记录_${new Date().toLocaleDateString()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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