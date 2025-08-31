import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HexagonChart from './components/HexagonChart';
import { userStatisticsService } from './services/userStatisticsService';
import type { UserStats } from './services/userStatisticsService';


interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalArticles: 0,
    completedArticles: 0,
    totalStudyTime: 0,
    averageScore: 0,
    currentStreak: 0,
    domainScores: {
      safety: 0,
      maintenance: 0,
      emergency: 0,
      signal: 0,
      dispatch: 0,
      operation: 0
    },
    recentLearning: []
  });

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 获取用户统计数据
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    setLoading(true);
    try {
      const data = await userStatisticsService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('加载用户统计失败:', error);
    } finally {
      setLoading(false);
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
      padding: isMobile ? '15px' : '20px',
      color: '#fff',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '12px' : '15px',
        marginBottom: isMobile ? '20px' : '30px',
        padding: isMobile ? '16px' : '20px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>欢迎，{user?.name}</h2>
                          <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>角色：{
                  user?.role === 'admin' ? '系统管理员' : 
                  user?.role === 'maintenance' ? '维护人员' : 
                  '普通用户'
                }</p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '8px' : '10px', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {user?.role === 'user' && (
            <button
              onClick={() => navigate('/articles')}
              style={{
                padding: isMobile ? '12px 16px' : '10px 20px',
                background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '14px',
                minWidth: isMobile ? 'auto' : '120px',
                width: isMobile ? '100%' : 'auto'
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
                padding: isMobile ? '12px 16px' : '10px 20px',
                background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '14px',
                minWidth: isMobile ? 'auto' : '120px',
                width: isMobile ? '100%' : 'auto'
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
                padding: isMobile ? '12px 16px' : '10px 20px',
                background: 'linear-gradient(90deg,#e6a23c 60%,#cf9236 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '14px',
                minWidth: isMobile ? 'auto' : '120px',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              后台维护 (maintenance)
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: isMobile ? '12px 16px' : '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '14px',
              minWidth: isMobile ? 'auto' : '120px',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: isMobile ? '15px' : '20px',
        marginBottom: isMobile ? '20px' : '30px'
      }}>
        <div style={{
          background: 'rgba(64, 158, 255, 0.2)',
          padding: isMobile ? '16px' : '20px',
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
          padding: isMobile ? '16px' : '20px',
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
          padding: isMobile ? '16px' : '20px',
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
        <div style={{ marginBottom: isMobile ? '20px' : '30px' }}>
          <HexagonChart scores={stats.domainScores} />
        </div>
      )}

      {/* 最近学习记录 */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: isMobile ? '16px' : '20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: isMobile ? '16px' : '18px' }}>最近学习记录</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#fff' }}>
              加载中...
            </div>
          ) : stats.recentLearning && stats.recentLearning.length > 0 ? (
            stats.recentLearning.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                <span style={{ fontWeight: 'bold' }}>《{item.articleTitle}》</span>
                <span style={{ opacity: 0.8, fontSize: '14px' }}>
                  {new Date(item.completedAt).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              暂无学习记录
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default Dashboard; 