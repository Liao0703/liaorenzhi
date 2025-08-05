// 云服务器文件上传服务 - 统一上传到云服务器
export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileId?: string;
  fileType?: string;
  fileSize?: number;
  error?: string;
}

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/msword': 'word',
  'text/plain': 'text',
  'text/html': 'html',
  'application/json': 'json',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image'
};

// 检查文件类型是否支持
export const isFileTypeSupported = (fileType: string): boolean => {
  return Object.keys(SUPPORTED_FILE_TYPES).includes(fileType);
};

// 获取文件类型
export const getFileType = (fileType: string): string => {
  return SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES] || 'unknown';
};

// 云服务器配置 
const CLOUD_SERVER_URL = window.location.origin; // 使用当前域名
const FILE_API_BASE = `${CLOUD_SERVER_URL}/api/files`;

// 统一文件上传到云服务器
export const uploadFileToServer = async (file: File): Promise<FileUploadResult> => {
  try {
    console.log('开始上传文件到云服务器:', file.name);

    // 检查文件类型
    if (!isFileTypeSupported(file.type)) {
      return {
        success: false,
        error: `不支持的文件类型: ${file.type}`
      };
    }

    // 检查文件大小 (50MB限制)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: '文件大小超过50MB限制'
      };
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);

    // 上传文件
    const response = await fetch(`${FILE_API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `上传失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('文件上传成功:', result);
    return {
      success: true,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileId: result.fileId,
        fileType: result.fileType,
        fileSize: result.fileSize
      };
    } else {
      throw new Error(result.error || '上传失败');
    }

  } catch (error) {
    console.error('文件上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    };
  }
};

// 主要文件上传函数 - 替换原来的uploadFileToOSS
export const uploadFileToOSS = uploadFileToServer;

// 检查文件是否可访问
export const checkFileAccessibility = async (fileUrl: string): Promise<boolean> => {
  try {
    if (!fileUrl) return false;
    
    const response = await fetch(fileUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('检查文件可访问性失败:', error);
    return false;
  }
};

// 验证文件URL
export const validateFileUrl = async (fileUrl: string): Promise<{ accessible: boolean; error?: string }> => {
  try {
    if (!fileUrl) {
      return { accessible: false, error: '文件URL为空' };
    }

    const accessible = await checkFileAccessibility(fileUrl);
    
    if (!accessible) {
      return { 
        accessible: false, 
        error: '文件无法访问，可能已被删除或权限不足' 
      };
    }

    return { accessible: true };
  } catch (error) {
    return { 
      accessible: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
};

// 获取云服务器文件列表
export const getServerFileList = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${FILE_API_BASE}/list`);
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.status}`);
    }
    
    const result = await response.json();
    return result.files || [];
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return [];
  }
};

// 删除云服务器文件
export const deleteServerFile = async (filename: string): Promise<boolean> => {
  try {
    const response = await fetch(`${FILE_API_BASE}/delete/${filename}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`删除文件失败: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

// 获取文件预览URL - 修复导入错误
export const getFilePreviewUrl = (fileUrl: string, fileType: string): string => {
  try {
    if (!fileUrl) {
      console.error('文件URL为空');
      return '';
    }

    // 检查URL是否有效
    let isValidUrl = false;
    try {
      new URL(fileUrl);
      isValidUrl = true;
    } catch (error) {
      // 如果是相对URL，补充完整URL
      if (fileUrl.startsWith('/')) {
        fileUrl = `${CLOUD_SERVER_URL}${fileUrl}`;
        isValidUrl = true;
      } else {
        console.error('无效的文件URL:', fileUrl);
        return '';
      }
    }

    if (fileType === 'pdf') {
      // PDF可以直接预览
      return fileUrl;
    } else if (fileType === 'word') {
      // Word文件使用Office Online Viewer
      if (isValidUrl) {
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      }
    } else if (fileType === 'text' || fileType === 'html') {
      // 文本文件可以直接预览
      return fileUrl;
    } else if (fileType === 'image') {
      // 图片文件直接显示
      return fileUrl;
    }

    // 默认返回下载链接
    return fileUrl;
  } catch (error) {
    console.error('生成文件预览URL失败:', error);
    return fileUrl || '';
  }
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 

// 云服务器文件存储配置（禁用OSS和本地存储）
export const STORAGE_CONFIG = {
  // 存储类型：只使用云服务器
  storageType: 'server' as const,
  
  // 禁用OSS
  ossEnabled: false,
  
  // 禁用本地存储
  localStorageEnabled: false,
  
  // 云服务器配置
  serverConfig: {
    baseUrl: CLOUD_SERVER_URL,
    apiPath: '/api/files',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedTypes: Object.keys(SUPPORTED_FILE_TYPES)
  }
};

console.log('🔧 存储配置已更新：');
console.log('- OSS存储：❌ 已禁用');
console.log('- 本地存储：❌ 已禁用'); 
console.log('- 云服务器存储：✅ 已启用');
console.log(`- 云服务器地址：${CLOUD_SERVER_URL}`); 