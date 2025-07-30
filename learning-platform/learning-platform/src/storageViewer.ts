// 存储查看器 - 用于查看LocalStorage中的具体数据
export interface StorageInfo {
  key: string;
  size: string;
  data: any;
  itemCount?: number;
}

// 获取所有学习相关的存储数据
export const getLearningStorageData = (): StorageInfo[] => {
  const storageKeys = [
    'learning_articles',
    'learning_photos', 
    'learning_settings'
  ];
  
  const results: StorageInfo[] = [];
  
  storageKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsedData = JSON.parse(data);
        const size = formatBytes(new Blob([data]).size);
        let itemCount: number | undefined;
        
        // 计算项目数量
        if (Array.isArray(parsedData)) {
          itemCount = parsedData.length;
        } else if (typeof parsedData === 'object') {
          itemCount = Object.keys(parsedData).length;
        }
        
        results.push({
          key,
          size,
          data: parsedData,
          itemCount
        });
      }
    } catch (error) {
      console.error(`读取存储键 ${key} 失败:`, error);
    }
  });
  
  return results;
};

// 格式化字节大小
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取存储使用情况
export const getStorageUsage = () => {
  const totalSize = getLearningStorageData().reduce((total, item) => {
    return total + new Blob([JSON.stringify(item.data)]).size;
  }, 0);
  
  // LocalStorage通常限制为5-10MB
  const maxSize = 5 * 1024 * 1024; // 5MB
  const usagePercent = (totalSize / maxSize) * 100;
  
  return {
    used: formatBytes(totalSize),
    max: formatBytes(maxSize),
    percent: usagePercent.toFixed(1),
    remaining: formatBytes(maxSize - totalSize)
  };
};

// 导出存储数据为可读格式
export const exportStorageReport = (): string => {
  const storageData = getLearningStorageData();
  const usage = getStorageUsage();
  
  let report = `# 学习系统存储报告\n`;
  report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  report += `## 存储使用情况\n`;
  report += `- 已使用: ${usage.used}\n`;
  report += `- 最大容量: ${usage.max}\n`;
  report += `- 使用率: ${usage.percent}%\n`;
  report += `- 剩余空间: ${usage.remaining}\n\n`;
  
  report += `## 详细数据\n\n`;
  
  storageData.forEach(item => {
    report += `### ${item.key}\n`;
    report += `- 大小: ${item.size}\n`;
    if (item.itemCount !== undefined) {
      report += `- 项目数量: ${item.itemCount}\n`;
    }
    report += `- 数据类型: ${Array.isArray(item.data) ? '数组' : typeof item.data}\n`;
    report += `- 数据预览: ${JSON.stringify(item.data).substring(0, 200)}...\n\n`;
  });
  
  return report;
};

// 清理特定存储项
export const clearStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`清理存储项 ${key} 失败:`, error);
    return false;
  }
};

// 获取存储项的详细信息
export const getStorageItemDetails = (key: string): StorageInfo | null => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsedData = JSON.parse(data);
      const size = formatBytes(new Blob([data]).size);
      let itemCount: number | undefined;
      
      if (Array.isArray(parsedData)) {
        itemCount = parsedData.length;
      } else if (typeof parsedData === 'object') {
        itemCount = Object.keys(parsedData).length;
      }
      
      return {
        key,
        size,
        data: parsedData,
        itemCount
      };
    }
  } catch (error) {
    console.error(`获取存储项 ${key} 详情失败:`, error);
  }
  return null;
}; 