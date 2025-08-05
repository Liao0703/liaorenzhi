import React, { useState } from 'react';

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
const LearningRecordManagement = React.lazy(() => import('./components/LearningRecordManagement'));
const MaintenancePanel = React.lazy(() => import('./MaintenancePanel'));

interface MaintenanceAdminPanelProps {
  user: any;
  onLogout: () => void;
}

const MaintenanceAdminPanel: React.FC<MaintenanceAdminPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'records' | 'maintenance'>('records');

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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '15px 25px',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            🔧 维护人员管理后台
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            欢迎，{user.name || user.username} ({user.role === 'admin' ? '系统管理员' : '维护人员'})
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 71, 87, 0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          🚪 退出登录
        </button>
      </div>

      {/* 功能选项卡 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        backdropFilter: 'blur(10px)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '25px',
          borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
          paddingBottom: '20px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveTab('records')}
            style={{
              padding: '15px 30px',
              background: activeTab === 'records' 
                ? 'linear-gradient(90deg, #409eff 60%, #2b8cff 100%)' 
                : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              justifyContent: 'center',
              boxShadow: activeTab === 'records' ? '0 4px 15px rgba(64, 158, 255, 0.3)' : 'none',
              transform: activeTab === 'records' ? 'translateY(-2px)' : 'none'
            }}
          >
            📊 学习记录
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            style={{
              padding: '15px 30px',
              background: activeTab === 'maintenance' 
                ? 'linear-gradient(90deg, #409eff 60%, #2b8cff 100%)' 
                : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              justifyContent: 'center',
              boxShadow: activeTab === 'maintenance' ? '0 4px 15px rgba(64, 158, 255, 0.3)' : 'none',
              transform: activeTab === 'maintenance' ? 'translateY(-2px)' : 'none'
            }}
          >
            🛠️ 系统维护
          </button>
        </div>

        {/* 功能说明 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
          color: '#fff',
          fontSize: '14px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          marginTop: '10px',
          lineHeight: '1.6'
        }}>
          {activeTab === 'records' && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '15px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                📊 学习记录功能
              </div>
              <ul style={{ 
                margin: '0', 
                paddingLeft: '20px',
                listStyleType: 'disc'
              }}>
                <li style={{ marginBottom: '8px' }}>查看和统计用户学习记录</li>
                <li style={{ marginBottom: '8px' }}>监控学习进度和测验成绩</li>
                <li style={{ marginBottom: '8px' }}>按部门、班组、时间筛选记录</li>
                <li style={{ marginBottom: '8px' }}>导出学习数据报告</li>
                <li style={{ marginBottom: '8px' }}>学习效果分析和统计</li>
              </ul>
            </div>
          )}
          {activeTab === 'maintenance' && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '15px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                🛠️ 系统维护功能
              </div>
              <ul style={{ 
                margin: '0', 
                paddingLeft: '20px',
                listStyleType: 'disc'
              }}>
                <li style={{ marginBottom: '8px' }}>启用/禁用系统维护模式</li>
                <li style={{ marginBottom: '8px' }}>设置维护原因和详细信息</li>
                <li style={{ marginBottom: '8px' }}>查看维护历史记录</li>
                <li style={{ marginBottom: '8px' }}>服务器状态监控</li>
                <li style={{ marginBottom: '8px' }}>系统健康检查</li>
              </ul>
            </div>
          )}
        </div>
      </div>

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
          {activeTab === 'records' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}>
              <LearningRecordManagement currentUser={user} />
            </div>
          )}
          {activeTab === 'maintenance' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}>
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