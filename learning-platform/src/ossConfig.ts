// 阿里云OSS配置
export interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
}

// 默认OSS配置（需要用户填写）
export const defaultOSSConfig: OSSConfig = {
  region: 'oss-cn-chengdu', // 根据您的Bucket地域
  accessKeyId: '', // 您的AccessKey ID
  accessKeySecret: '', // 您的AccessKey Secret
  bucket: '', // 您的Bucket名称
  endpoint: 'https://oss-cn-chengdu.aliyuncs.com' // 根据您的Bucket地域
};

// 从localStorage加载OSS配置
export const loadOSSConfig = (): OSSConfig => {
  try {
    const stored = localStorage.getItem('learning_oss_config');
    if (stored) {
      const config = JSON.parse(stored);
      return { ...defaultOSSConfig, ...config };
    }
  } catch (error) {
    console.error('加载OSS配置失败:', error);
  }
  return defaultOSSConfig;
};

// 保存OSS配置到localStorage
export const saveOSSConfig = (config: OSSConfig) => {
  try {
    localStorage.setItem('learning_oss_config', JSON.stringify(config));
  } catch (error) {
    console.error('保存OSS配置失败:', error);
  }
};

// 验证OSS配置是否完整
export const validateOSSConfig = (config: OSSConfig): boolean => {
  return !!(config.region && config.accessKeyId && config.accessKeySecret && config.bucket && config.endpoint);
};

// 获取OSS配置状态
export const getOSSConfigStatus = () => {
  const config = loadOSSConfig();
  return {
    isConfigured: validateOSSConfig(config),
    config
  };
}; 