import React, { useState, useEffect } from 'react';
import { maintenanceService } from './maintenanceService';
import type { MaintenanceConfig } from './maintenanceService';

const MaintenanceTest: React.FC = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceConfig | null>(null);

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = () => {
    const enabled = maintenanceService.isMaintenanceMode();
    const info = maintenanceService.getMaintenanceInfo();
    setIsMaintenanceMode(enabled);
    setMaintenanceInfo(info);
  };

  const enableMaintenance = () => {
    maintenanceService.enableMaintenance({
      reason: '系统测试维护',
      message: '这是一个测试维护，用于验证维护模式功能是否正常工作。',
      enabledBy: '测试用户',
      startTime: new Date().toISOString()
    });
    checkMaintenanceStatus();
  };

  const disableMaintenance = () => {
    maintenanceService.disableMaintenance('测试用户');
    checkMaintenanceStatus();
  };

  const clearMaintenance = () => {
    maintenanceService.clearMaintenanceConfig();
    checkMaintenanceStatus();
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>维护模式测试页面</h1>
      
      <div style={{
        background: isMaintenanceMode ? '#fff3cd' : '#d4edda',
        border: `1px solid ${isMaintenanceMode ? '#ffeaa7' : '#c3e6cb'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3>当前状态</h3>
        <p><strong>维护模式：</strong>{isMaintenanceMode ? '已启用' : '未启用'}</p>
        {maintenanceInfo && (
          <div>
            <p><strong>维护原因：</strong>{maintenanceInfo.reason}</p>
            <p><strong>维护信息：</strong>{maintenanceInfo.message}</p>
            <p><strong>维护人员：</strong>{maintenanceInfo.enabledBy}</p>
            <p><strong>开始时间：</strong>{new Date(maintenanceInfo.startTime).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>操作按钮</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={enableMaintenance}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            启用维护模式
          </button>
          
          <button
            onClick={disableMaintenance}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            禁用维护模式
          </button>
          
          <button
            onClick={clearMaintenance}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            清除维护配置
          </button>
          
          <button
            onClick={checkMaintenanceStatus}
            style={{
              padding: '10px 20px',
              background: '#17a2b8',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            刷新状态
          </button>
        </div>
      </div>

      <div style={{
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3>使用说明</h3>
        <ul>
          <li>点击"启用维护模式"按钮来启用维护模式</li>
          <li>启用后，系统会显示维护页面，阻止用户访问其他功能</li>
          <li>点击"禁用维护模式"按钮来禁用维护模式</li>
          <li>点击"清除维护配置"按钮来清除所有维护相关的本地存储数据</li>
          <li>点击"刷新状态"按钮来重新检查维护模式状态</li>
        </ul>
      </div>
    </div>
  );
};

export default MaintenanceTest; 