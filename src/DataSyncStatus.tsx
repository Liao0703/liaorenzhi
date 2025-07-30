import React, { useState, useEffect } from 'react';
import dataSyncService from './dataSyncService';
import type { SyncStatus } from './dataSyncService';

interface DataSyncStatusProps {
  className?: string;
}

const DataSyncStatus: React.FC<DataSyncStatusProps> = ({ className }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: new Date(),
    isOnline: navigator.onLine,
    pendingChanges: 0
  });

  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(dataSyncService.getSyncStatus());
    };

    // 初始更新
    updateStatus();

    // 定期更新状态
    const interval = setInterval(updateStatus, 5000);

    // 监听在线状态变化
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    try {
      await dataSyncService.manualSync();
      setSyncStatus(dataSyncService.getSyncStatus());
    } catch (error) {
      console.error('手动同步失败:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      padding: '12px',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
      fontSize: '12px',
      zIndex: 1000,
      minWidth: '200px'
    }} className={className}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold' }}>数据同步状态</span>
        <button
          onClick={handleManualSync}
          style={{
            padding: '4px 8px',
            background: 'rgba(64, 158, 255, 0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          手动同步
        </button>
      </div>
      
      <div style={{ lineHeight: '1.4' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          marginBottom: '4px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: syncStatus.isOnline ? '#67c23a' : '#f56c6c'
          }} />
          <span>{syncStatus.isOnline ? '在线' : '离线'}</span>
        </div>
        
        <div style={{ marginBottom: '4px' }}>
          最后同步: {formatTime(syncStatus.lastSync)}
        </div>
        
        {syncStatus.pendingChanges > 0 && (
          <div style={{ color: '#e6a23c' }}>
            待同步: {syncStatus.pendingChanges} 项
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSyncStatus; 