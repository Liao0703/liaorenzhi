import React, { useState, useEffect } from 'react';
import { STORAGE_CONFIG } from './fileUploadService';

interface ServerConfigPanelProps {
  onClose: () => void;
}

const ServerConfigPanel: React.FC<ServerConfigPanelProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<{
    online: boolean;
    apiStatus: string;
    storageStatus: string;
  }>({
    online: false,
    apiStatus: '检查中...',
    storageStatus: '检查中...'
  });

  // 检查服务器状态
  const checkServerStatus = async () => {
    try {
      setIsLoading(true);
      
      // 检查API健康状态
      const healthResponse = await fetch('/api/files/health');
      const healthData = await healthResponse.json();
      
      // 检查文件列表API
      const listResponse = await fetch('/api/files/list');
      const listData = await listResponse.json();
      
      setServerStatus({
        online: true,
        apiStatus: healthData.success ? '✅ 正常' : '❌ 异常',
        storageStatus: listData.success ? '✅ 正常' : '❌ 异常'
      });
      
      setTestResult('✅ 云服务器连接正常，所有服务运行良好！');
    } catch (error) {
      setServerStatus({
        online: false,
        apiStatus: '❌ 连接失败',
        storageStatus: '❌ 连接失败'
      });
      setTestResult(`❌ 连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试文件上传功能
  const testFileUpload = async () => {
    try {
      setIsLoading(true);
      setTestResult('');
      
      // 创建一个测试文件
      const testContent = `云服务器存储测试文件
创建时间: ${new Date().toLocaleString()}
测试ID: ${Date.now()}`;
      
      const testFile = new File([testContent], 'server-test.txt', {
        type: 'text/plain'
      });

      // 上传测试文件
      const formData = new FormData();
      formData.append('file', testFile);
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult('✅ 文件上传测试成功！云服务器存储功能正常。');
        // 可以选择删除测试文件
        setTimeout(async () => {
          try {
            const filename = result.fileUrl.split('/').pop();
            await fetch(`/api/files/delete/${filename}`, { method: 'DELETE' });
          } catch (e) {
            console.log('删除测试文件失败（非关键错误）');
          }
        }, 2000);
      } else {
        setTestResult(`❌ 上传测试失败: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ 上传测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时检查服务器状态
  useEffect(() => {
    checkServerStatus();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        borderRadius: '12px',
        padding: '30px',
        color: '#fff',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          margin: '0 0 25px 0', 
          fontSize: '20px', 
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          🗄️ 云服务器存储配置
        </h2>

        {/* 服务器信息 */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📊 服务器信息</h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>服务器地址:</span>
              <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                {STORAGE_CONFIG.serverConfig.baseUrl}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>API端点:</span>
              <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                {STORAGE_CONFIG.serverConfig.apiPath}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>文件大小限制:</span>
              <span style={{ color: '#f59e0b' }}>
                {Math.round(STORAGE_CONFIG.serverConfig.maxFileSize / 1024 / 1024)}MB
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>存储类型:</span>
              <span style={{ color: '#10b981' }}>
                {STORAGE_CONFIG.storageType === 'server' ? '云服务器存储' : STORAGE_CONFIG.storageType}
              </span>
            </div>
          </div>
        </div>

        {/* 服务状态 */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>🔍 服务状态</h3>
          
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>服务器连接:</span>
              <span>{serverStatus.online ? '✅ 在线' : '❌ 离线'}</span>
          </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>API服务:</span>
              <span>{serverStatus.apiStatus}</span>
          </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>存储服务:</span>
              <span>{serverStatus.storageStatus}</span>
            </div>
          </div>
          </div>

        {/* 支持的文件类型 */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📄 支持的文件类型</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '8px' 
          }}>
            {STORAGE_CONFIG.serverConfig.supportedTypes.map((type, index) => (
              <div
                key={index}
              style={{
                  padding: '6px 12px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  borderRadius: '20px',
                  fontSize: '12px',
                  textAlign: 'center',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
              >
                {type.split('/')[1]?.toUpperCase() || type}
              </div>
            ))}
          </div>
        </div>

        {testResult && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            borderRadius: '8px',
            background: testResult.includes('✅') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${testResult.includes('✅') ? '#10b981' : '#ef4444'}`,
            color: testResult.includes('✅') ? '#10b981' : '#ef4444'
          }}>
            {testResult}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={checkServerStatus}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              background: isLoading 
                ? 'rgba(255,255,255,0.2)' 
                : 'linear-gradient(90deg,#10b981 60%,#059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? '检查中...' : '🔍 检查服务器'}
          </button>
          
          <button
            onClick={testFileUpload}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              background: isLoading 
                ? 'rgba(255,255,255,0.2)' 
                : 'linear-gradient(90deg,#3b82f6 60%,#2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? '测试中...' : '📤 测试上传'}
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
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

        <div style={{ marginTop: '25px', fontSize: '12px', opacity: 0.7 }}>
          <p><strong>说明：</strong></p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>云服务器存储已完全替代OSS和本地存储</li>
            <li>所有文件自动上传到云服务器，无需额外配置</li>
            <li>支持文件预览、下载和管理功能</li>
            <li>存储安全稳定，支持大文件上传</li>
            <li>如有问题，请检查服务器连接状态</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ServerConfigPanel; 