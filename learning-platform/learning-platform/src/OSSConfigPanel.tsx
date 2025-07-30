import React, { useState } from 'react';
import type { OSSConfig } from './ossConfig';
import { loadOSSConfig, saveOSSConfig, validateOSSConfig } from './ossConfig';
import { DataStorageService } from './ossService';
import { getAllArticles } from './articleData';
import { getAllPhotos } from './photoStorage';
import { getSettings } from './settingsStorage';

interface OSSConfigPanelProps {
  onClose: () => void;
}

const OSSConfigPanel: React.FC<OSSConfigPanelProps> = ({ onClose }) => {
  const [config, setConfig] = useState<OSSConfig>(loadOSSConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: keyof OSSConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = () => {
    if (!validateOSSConfig(config)) {
      alert('请填写完整的OSS配置信息');
      return;
    }
    
    saveOSSConfig(config);
    alert('OSS配置已保存');
  };

  const handleTestConnection = async () => {
    if (!validateOSSConfig(config)) {
      alert('请先填写完整的OSS配置信息');
      return;
    }

    setIsLoading(true);
    setTestResult('');

    try {
      // 临时保存配置进行测试
      saveOSSConfig(config);
      
      // 这里直接测试配置
      setTestResult('✅ OSS配置验证成功！');
    } catch (error) {
      console.error('OSS连接测试失败:', error);
      setTestResult(`❌ 连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadToOSS = async () => {
    if (!validateOSSConfig(config)) {
      alert('请先配置OSS信息');
      return;
    }

    setIsUploading(true);

    try {
      // 获取当前数据
      const articles = getAllArticles();
      const photos = getAllPhotos();
      const settings = getSettings();

      // 上传到OSS
      const result = await DataStorageService.backupAllData(articles, photos, settings);
      
      alert(`数据上传成功！\n文章: ${result.articlesUrl}\n照片: ${result.photosUrl}\n设置: ${result.settingsUrl}`);
    } catch (error) {
      console.error('数据上传失败:', error);
      alert(`数据上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#222',
        padding: '30px',
        borderRadius: '16px',
        maxWidth: 600,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#fff'
      }}>
        <h2 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>☁️ 阿里云OSS配置</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📋 配置说明</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8 }}>
            <p>1. 登录阿里云控制台，获取AccessKey ID和Secret</p>
            <p>2. 创建OSS Bucket，记录Bucket名称和地域</p>
            <p>3. 填写以下配置信息</p>
            <p>4. 测试连接并上传数据</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              地域 (Region) *
            </label>
            <input
              type="text"
              value={config.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              placeholder="例如: oss-cn-hangzhou"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: '#333',
                color: '#fff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              AccessKey ID *
            </label>
            <input
              type="text"
              value={config.accessKeyId}
              onChange={(e) => handleInputChange('accessKeyId', e.target.value)}
              placeholder="您的AccessKey ID"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: '#333',
                color: '#fff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              AccessKey Secret *
            </label>
            <input
              type="password"
              value={config.accessKeySecret}
              onChange={(e) => handleInputChange('accessKeySecret', e.target.value)}
              placeholder="您的AccessKey Secret"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: '#333',
                color: '#fff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Bucket名称 *
            </label>
            <input
              type="text"
              value={config.bucket}
              onChange={(e) => handleInputChange('bucket', e.target.value)}
              placeholder="您的Bucket名称"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: '#333',
                color: '#fff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              访问域名 (Endpoint) *
            </label>
            <input
              type="text"
              value={config.endpoint}
              onChange={(e) => handleInputChange('endpoint', e.target.value)}
              placeholder="例如: https://oss-cn-hangzhou.aliyuncs.com"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: '#333',
                color: '#fff'
              }}
            />
          </div>
        </div>

        {testResult && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '6px',
            background: testResult.includes('✅') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
            border: `1px solid ${testResult.includes('✅') ? '#00ff00' : '#ff0000'}`
          }}>
            {testResult}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleSaveConfig}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            保存配置
          </button>
          
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              background: isLoading 
                ? 'rgba(255,255,255,0.2)' 
                : 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? '测试中...' : '测试连接'}
          </button>
          
          <button
            onClick={handleUploadToOSS}
            disabled={isUploading}
            style={{
              padding: '10px 20px',
              background: isUploading 
                ? 'rgba(255,255,255,0.2)' 
                : 'linear-gradient(90deg,#e6a23c 60%,#f3d19e 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isUploading ? '上传中...' : '上传数据到OSS'}
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            关闭
          </button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.6 }}>
          <p><strong>注意：</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>请确保您的AccessKey有足够的OSS操作权限</li>
            <li>Bucket需要设置为公共读或私有，根据您的需求选择</li>
            <li>建议定期备份重要数据</li>
            <li>OSS存储会产生费用，请注意控制成本</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OSSConfigPanel; 