import React, { useState, useEffect } from 'react';
import { HybridStorageService, StorageFile } from './hybridStorageService';

interface HybridStoragePanelProps {
  onClose: () => void;
}

const HybridStoragePanel: React.FC<HybridStoragePanelProps> = ({ onClose }) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState(HybridStorageService.getStats());
  const [isLoading, setIsLoading] = useState(false);

  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 加载文件列表
  const loadFiles = () => {
    const fileList = HybridStorageService.getFiles();
    setFiles(fileList);
    setStats(HybridStorageService.getStats());
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // 同步到OSS
  const handleSyncToOSS = async () => {
    setIsLoading(true);
    try {
      const result = await HybridStorageService.syncAllToOSS();
      alert(`同步完成！成功: ${result.success} 个文件，失败: ${result.failed} 个文件`);
      loadFiles();
    } catch (error) {
      alert(`同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 清理缓存
  const handleCleanupCache = () => {
    try {
      const result = HybridStorageService.cleanupCache();
      alert(`清理完成！删除: ${result.removed} 个文件，释放: ${formatBytes(result.freedSize)}`);
      loadFiles();
    } catch (error) {
      alert(`清理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 删除文件
  const handleDeleteFile = (fileId: string) => {
    if (window.confirm('确定要删除这个文件吗？')) {
      HybridStorageService.deleteFile(fileId);
      loadFiles();
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
        maxWidth: 800,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#fff'
      }}>
        <h2 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>💾 混合存储管理</h2>
        
        {/* 存储统计 */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📊 存储统计</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#409eff' }}>{stats.localFiles}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>本地文件</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#67c23a' }}>{stats.ossFiles}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>OSS文件</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e6a23c' }}>{formatBytes(stats.localSize)}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>本地大小</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f56c6c' }}>{formatBytes(stats.ossSize)}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>OSS大小</div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSyncToOSS}
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
            {isLoading ? '同步中...' : '🔄 同步到OSS'}
          </button>
          
          <button
            onClick={handleCleanupCache}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(90deg,#e6a23c 60%,#f3d19e 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ 清理缓存
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

        {/* 文件列表 */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>📁 文件列表</h3>
          </div>
          
          {files.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
              暂无文件
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {files.map(file => (
                <div
                  key={file.id}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {formatBytes(file.size)} • {file.type} • 访问 {file.accessCount} 次
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                      上传: {new Date(file.uploadTime).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {file.localUrl && (
                      <span style={{
                        padding: '2px 6px',
                        background: 'rgba(64, 158, 255, 0.2)',
                        color: '#409eff',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                        本地
                      </span>
                    )}
                    {file.ossUrl && (
                      <span style={{
                        padding: '2px 6px',
                        background: 'rgba(103, 194, 58, 0.2)',
                        color: '#67c23a',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                        OSS
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(245, 108, 108, 0.2)',
                        color: '#f56c6c',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.6 }}>
          <p><strong>说明：</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>本地文件：存储在浏览器本地，访问速度快</li>
            <li>OSS文件：存储在阿里云OSS，支持云端访问</li>
            <li>混合存储：同时保存在本地和OSS，提供最佳体验</li>
            <li>清理缓存：删除7天未访问的本地文件（已同步到OSS）</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HybridStoragePanel; 