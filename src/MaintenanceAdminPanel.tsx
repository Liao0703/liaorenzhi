import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// 添加旋转动画样式
const spinKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// 创建style元素并添加到head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = spinKeyframes;
  if (!document.head.querySelector('style[data-spin-animation]')) {
    styleElement.setAttribute('data-spin-animation', 'true');
    document.head.appendChild(styleElement);
  }
}

// 动态导入组件，避免路径问题
const UserManagement = React.lazy(() => import('./components/UserManagement'));
const MaintenancePanel = React.lazy(() => import('./MaintenancePanel'));

interface MaintenanceAdminPanelProps {
  user: any;
  onLogout: () => void;
}

const MaintenanceAdminPanel: React.FC<MaintenanceAdminPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'maintenance'>('users');
  const location = useLocation();
  const navigate = useNavigate();

  // URL ?tab=users|maintenance 控制选项卡
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'users' || tab === 'maintenance') setActiveTab(tab);
  }, [location.search]);

  // 权限检查
  if (!user || (user.role !== 'maintenance' && user.role !== 'admin')) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <h2>⚠️ 权限不足</h2>
          <p>您需要维护人员或管理员权限才能访问此页面</p>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              background: '#ff4757',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#f5f7fb',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* 右上角返回首页与退出 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 14px',
            background: '#111827',
            color: '#fff',
            border: '1px solid #111827',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          返回首页
        </button>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 14px',
            background: '#fff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          退出登录
        </button>
      </div>
      {/* 顶部说明与标签区域已移除（首页可直达） */}

      {/* 功能内容区域 */}
      <div style={{
        marginTop: '20px',
        minHeight: '400px'
      }}>
        <React.Suspense fallback={
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>加载中...</div>
          </div>
        }>
          {activeTab === 'users' && (
            <div style={{ background: 'transparent' }}>
              <UserManagement currentUser={user} />
            </div>
          )}
          {activeTab === 'maintenance' && (
            <div style={{ background: 'transparent' }}>
              <MaintenancePanel user={user} />
            </div>
          )}
        </React.Suspense>
      </div>

      {/* 底部信息 */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '12px'
      }}>
        <p>班前学习监督系统 - 维护人员管理后台 v1.0.0</p>
        <p>如有问题请联系系统管理员</p>
      </div>
    </div>
  );
};

export default MaintenanceAdminPanel; 