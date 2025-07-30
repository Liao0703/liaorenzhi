import { ossService } from './ossService';
import type { FileUploadResult } from './hybridStorageService';

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/msword': 'word',
  'text/plain': 'text',
  'text/html': 'html',
  'application/json': 'json'
};

// 检查文件类型是否支持
export const isFileTypeSupported = (fileType: string): boolean => {
  return Object.keys(SUPPORTED_FILE_TYPES).includes(fileType);
};

// 获取文件类型
export const getFileType = (fileType: string): string => {
  return SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES] || 'unknown';
};

// 上传文件到OSS
export const uploadFileToOSS = async (file: File): Promise<FileUploadResult> => {
  try {
    // 检查文件类型
    if (!isFileTypeSupported(file.type)) {
      return {
        success: false,
        error: `不支持的文件类型: ${file.type}`
      };
    }

    // 检查文件大小（限制为50MB）
    if (file.size > 50 * 1024 * 1024) {
      return {
        success: false,
        error: `文件大小超过限制（最大50MB）`
      };
    }

    // 生成文件名
    const timestamp = new Date().getTime();
    const fileName = `articles/${timestamp}_${file.name}`;

    // 上传到OSS
    const fileUrl = await ossService.uploadFile(fileName, file, file.type);
    
    return {
      success: true,
      fileUrl,
      fileName: file.name
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    
    // 根据错误类型提供具体的错误信息
    let errorMessage = '文件上传失败';
    
    if (error instanceof Error) {
      if (error.message.includes('CORS') || error.message.includes('XHR error')) {
        errorMessage = 'CORS错误：请检查OSS Bucket的跨域设置。\n\n解决步骤：\n1. 登录阿里云OSS控制台\n2. 选择Bucket → 权限管理 → 跨域设置CORS\n3. 添加规则：来源*，方法GET/POST/PUT/DELETE/HEAD\n4. 等待5-10分钟后重试';
      } else if (error.message.includes('AccessKey')) {
        errorMessage = 'AccessKey错误：请检查OSS配置中的AccessKey ID和Secret是否正确';
      } else if (error.message.includes('Bucket')) {
        errorMessage = 'Bucket错误：请检查OSS配置中的Bucket名称和地域是否正确';
      } else if (error.message.includes('network')) {
        errorMessage = '网络错误：请检查网络连接是否正常';
      } else {
        errorMessage = `上传失败: ${error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// 获取文件预览URL
export const getFilePreviewUrl = (fileUrl: string, fileType: string): string => {
  if (fileType === 'pdf') {
    // PDF直接使用原URL
    return fileUrl;
  } else if (fileType === 'word') {
    // Word使用Office Online Viewer
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  } else {
    // 其他类型返回原URL
    return fileUrl;
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