import React, { useState, useEffect } from 'react';
import { maintenanceService } from './maintenanceService';
import type { MaintenanceConfig } from './maintenanceService';

interface MaintenancePageProps {
  onExitMaintenance?: () => void;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ onExitMaintenance }) => {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const loadMaintenanceInfo = () => {
      const info = maintenanceService.getMaintenanceInfo();
      setMaintenanceInfo(info);
    };

    loadMaintenanceInfo();
    
    // 每分钟检查一次维护状态
    const interval = setInterval(() => {
      loadMaintenanceInfo();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!maintenanceInfo) return;

    const updateTimeLeft = () => {
      const startTime = new Date(maintenanceInfo.startTime);
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [maintenanceInfo]);

  const handleExitMaintenance = () => {
    if (window.confirm('确定要退出维护模式吗？')) {
      maintenanceService.disableMaintenance('用户手动退出');
      if (onExitMaintenance) {
        onExitMaintenance();
      }
    }
  };

  if (!maintenanceInfo) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: '#fff'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* 维护图标 */}
        <div style={{
          fontSize: '80px',
          marginBottom: '20px',
          animation: 'pulse 2s infinite'
        }}>
          🔧
        </div>

        {/* 标题 */}
        <h1 style={{
          fontSize: '28px',
          marginBottom: '20px',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          系统维护中
        </h1>

        {/* 维护信息 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <strong>维护原因：</strong>
            <div style={{ marginTop: '5px', opacity: 0.9 }}>
              {maintenanceInfo.reason}
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>维护信息：</strong>
            <div style={{ marginTop: '5px', opacity: 0.9 }}>
              {maintenanceInfo.message}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>开始时间：</strong>
            <div style={{ marginTop: '5px', opacity: 0.9 }}>
              {new Date(maintenanceInfo.startTime).toLocaleString('zh-CN')}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>维护时长：</strong>
            <div style={{ 
              marginTop: '5px', 
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffd700',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {timeLeft}
            </div>
          </div>

          <div>
            <strong>维护人员：</strong>
            <div style={{ marginTop: '5px', opacity: 0.9 }}>
              {maintenanceInfo.enabledBy}
            </div>
          </div>
        </div>

        {/* 退出按钮 */}
        <button
          onClick={handleExitMaintenance}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          退出维护模式
        </button>

        {/* 提示信息 */}
        <div style={{
          marginTop: '20px',
          fontSize: '14px',
          opacity: 0.7,
          fontStyle: 'italic'
        }}>
          维护期间系统功能暂时不可用，请耐心等待
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage; 