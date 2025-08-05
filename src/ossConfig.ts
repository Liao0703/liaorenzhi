// 阿里云OSS配置 - 已禁用，改用云服务器存储

console.warn('⚠️ OSS存储已被禁用，所有文件现在统一上传到云服务器');

export interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
}

// OSS配置已禁用
export const defaultOSSConfig: OSSConfig = {
  region: 'DISABLED', 
  accessKeyId: 'DISABLED', 
  accessKeySecret: 'DISABLED', 
  bucket: 'DISABLED', 
  endpoint: 'DISABLED'
};

// OSS配置加载 - 已禁用
export const loadOSSConfig = (): OSSConfig => {
  console.warn('OSS存储已禁用，请使用云服务器存储');
  return defaultOSSConfig;
};

// OSS配置保存 - 已禁用
export const saveOSSConfig = (_config: Partial<OSSConfig>): void => {
  console.warn('OSS存储已禁用，配置保存被忽略');
};

// OSS配置验证 - 已禁用
export const validateOSSConfig = (_config: OSSConfig): boolean => {
  console.warn('OSS存储已禁用，验证总是返回false');
  return false;
};

// OSS配置状态
export const getOSSConfigStatus = (): { 
  isConfigured: boolean; 
  isEnabled: boolean; 
  message: string;
} => {
  return {
    isConfigured: false,
    isEnabled: false,
    message: 'OSS存储已禁用，现在使用云服务器存储'
  };
}; 