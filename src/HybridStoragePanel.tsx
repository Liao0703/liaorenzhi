import React, { useState, useEffect } from 'react';
import { getServerFileList, deleteServerFile, STORAGE_CONFIG } from './fileUploadService';

interface ServerStoragePanelProps {
  onClose: () => void;
}

interface ServerFile {
  filename: string;
  originalName: string;
  size: number;
  uploadTime: string;
  downloadUrl: string;
  previewUrl: string;
}

const ServerStoragePanel: React.FC<ServerStoragePanelProps> = ({ onClose }) => {
  const [files, setFiles] = useState<ServerFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalSize, setTotalSize] = useState(0);

  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 加载文件列表
  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const fileList = await getServerFileList();
      setFiles(fileList);
      
      // 计算总大小
      const total = fileList.reduce((sum, file) => sum + file.size, 0);
      setTotalSize(total);
    } catch (error) {
      console.error('加载文件列表失败:', error);
      setFiles([]);
      setTotalSize(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // 刷新文件列表
  const handleRefresh = async () => {
    await loadFiles();
  };

  // 删除文件
  const handleDeleteFile = async (filename: string) => {
    if (!confirm('确定要删除这个文件吗？此操作不可撤销。')) {
      return;
    }

    try {
      const success = await deleteServerFile(filename);
      if (success) {
        alert('文件删除成功');
        await loadFiles();
      } else {
        alert('文件删除失败');
      }
    } catch (error) {
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 导出文件列表
  const handleExportList = () => {
    try {
      const exportData = {
        files: files,
        totalFiles: files.length,
        totalSize: totalSize,
        exportTime: new Date().toISOString(),
        storageConfig: STORAGE_CONFIG
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `server-files-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('文件列表导出成功');
    } catch (error) {
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

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
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        borderRadius: '12px',
        padding: '20px',
        color: '#fff',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🗄️ 云服务器存储管理
          <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
            统一文件存储平台
          </span>
        </h2>
        
        {/* 存储统计 */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📊 存储统计</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{files.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>文件总数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{formatBytes(totalSize)}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>总存储大小</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>50MB</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>单文件限制</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>✅</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>服务状态</div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
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
            {isLoading ? '刷新中...' : '🔄 刷新列表'}
          </button>
          
          <button
            onClick={handleExportList}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(90deg,#f59e0b 60%,#d97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📦 导出列表
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
            <h3 style={{ margin: 0, fontSize: '16px' }}>📁 云服务器文件列表</h3>
          </div>
          
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
              正在加载文件列表...
            </div>
          ) : files.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
              暂无文件，上传文件后将显示在这里
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {files.map((file, index) => (
                <div
                  key={`${file.filename}-${index}`}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{file.originalName || file.filename}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {formatBytes(file.size)} • {file.filename}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                      上传: {new Date(file.uploadTime).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span style={{
                        padding: '2px 6px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                      云服务器
                      </span>
                    <a
                      href={file.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textDecoration: 'none'
                      }}
                    >
                      预览
                    </a>
                    <a
                      href={file.downloadUrl}
                      download
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textDecoration: 'none'
                      }}
                    >
                      下载
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.filename)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
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
          <p><strong>云服务器存储说明：</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>所有文件统一存储在云服务器，无需配置OSS或本地存储</li>
            <li>支持PDF、Word、图片、文本等多种文件格式</li>
            <li>单个文件最大支持50MB，存储稳定可靠</li>
            <li>文件自动备份，支持预览和下载功能</li>
            <li>可导出文件列表进行数据管理</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ServerStoragePanel; 