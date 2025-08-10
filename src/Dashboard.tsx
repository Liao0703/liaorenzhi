import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HexagonChart from './components/HexagonChart';


interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // 模拟学习统计数据
  const stats = {
    totalArticles: 15,
    completedArticles: 8,
    totalStudyTime: 240, // 分钟
    averageScore: 85,
    currentStreak: 5,
    // 各学习领域成绩
    domainScores: {
      safety: 88,      // 安全规程
      maintenance: 82, // 设备维护
      emergency: 75,   // 应急处理
      signal: 91,      // 信号系统
      dispatch: 79,    // 调度规范
      operation: 85    // 作业标准
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  // 调试信息：检查用户角色
  console.log('Dashboard - 当前用户信息:', user);
  console.log('Dashboard - 用户角色:', user?.role);

  // 维护人员自动跳转到维护管理页面
  useEffect(() => {
    if (user?.role === 'maintenance') {
      console.log('维护人员自动跳转到维护管理页面');
      navigate('/maintenance-admin');
    }
  }, [user, navigate]);

  return (
    <div style={{ 
      position: 'relative', 
      zIndex: 10, 
      padding: '20px',
      color: '#fff',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '30px',
        padding: '20px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>欢迎，{user?.name}</h2>
                          <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>角色：{
                  user?.role === 'admin' ? '系统管理员' : 
                  user?.role === 'maintenance' ? '维护人员' : 
                  '普通用户'
                }</p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {user?.role === 'user' && (
            <button
              onClick={() => navigate('/articles')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              学习中心
            </button>
          )}
                      {/* 管理员按钮 */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              管理后台 (admin)
            </button>
          )}

          {/* 维护人员按钮 */}
          {user?.role === 'maintenance' && (
            <button
              onClick={() => navigate('/maintenance-admin')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg,#e6a23c 60%,#cf9236 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              后台维护 (maintenance)
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'rgba(64, 158, 255, 0.2)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(64, 158, 255, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>学习进度</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {stats.completedArticles}/{stats.totalArticles}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            已完成 {Math.round((stats.completedArticles / stats.totalArticles) * 100)}%
          </div>
        </div>

        <div style={{
          background: 'rgba(103, 194, 58, 0.2)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(103, 194, 58, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>学习时长</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {stats.totalStudyTime}分钟
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            平均每次 {Math.round(stats.totalStudyTime / stats.completedArticles)} 分钟
          </div>
        </div>

        <div style={{
          background: 'rgba(230, 162, 60, 0.2)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(230, 162, 60, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>平均成绩</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {stats.averageScore}分
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            连续学习 {stats.currentStreak} 天
          </div>
        </div>
      </div>

      {/* 六边形学习领域成绩图 */}
      {user?.role === 'user' && (
        <div style={{ marginBottom: '30px' }}>
          <HexagonChart scores={stats.domainScores} />
        </div>
      )}

      {/* 最近学习记录 */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>最近学习记录</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            <span style={{ fontWeight: 'bold' }}>《铁路安全操作规程》</span>
            <span style={{ opacity: 0.8, fontSize: '14px' }}>2024-01-15 14:30</span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            <span style={{ fontWeight: 'bold' }}>《设备维护保养指南》</span>
            <span style={{ opacity: 0.8, fontSize: '14px' }}>2024-01-14 09:15</span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            <span style={{ fontWeight: 'bold' }}>《应急处理流程》</span>
            <span style={{ opacity: 0.8, fontSize: '14px' }}>2024-01-13 16:45</span>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Dashboard; 