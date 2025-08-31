import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ArticleLearningRecords from './components/ArticleLearningRecords';

// 动态导入用户管理组件
const UserManagement = React.lazy(() => import('./components/UserManagement'));

interface AdminPanelEnhancedProps {
  user: any;
}

interface UserRecord {
  id: number;
  name: string;
  username: string;
  employeeId: string;
  unit: string;
  department: string;
  team: string;
  jobType: string;
  completedArticles: number;
  totalStudyTime: number;
  averageScore: number;
  lastStudyTime: string;
  status: 'active' | 'inactive';
}

const AdminPanelEnhanced: React.FC<AdminPanelEnhancedProps> = ({ user: _user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'user-management' | 'article-records' | 'articles' | 'statistics' | 'photos' | 'settings'>('overview');
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      // 移动端默认收起侧边栏
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 根据 URL 查询参数 tab 同步选中的标签
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as typeof activeTab | null;
    const allowedTabs = new Set(['overview','users','user-management','article-records','articles','statistics','photos','settings']);
    if (tabParam && allowedTabs.has(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // 额外面板与筛选暂未启用（减少未使用警告）

  // 模拟用户学习记录
  const userRecords: UserRecord[] = [
    {
      id: 1,
      name: '张三',
      username: 'user001',
      employeeId: '10001',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转一班',
      jobType: '车站值班员',
      completedArticles: 8,
      totalStudyTime: 240,
      averageScore: 85,
      lastStudyTime: '2024-01-15 14:30',
      status: 'active'
    },
    // ... 其他用户数据
  ];

  // （已移除文章列表与文件上传等未使用逻辑，避免大量未使用变量警告）

  // 轻量卡片与子卡片通用样式（对齐新概览风格）
  const lightCard: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)'
  };
  // const subCard: React.CSSProperties = {
  //   background: 'rgba(255,255,255,0.05)',
  //   borderRadius: 8,
  //   border: '1px solid rgba(255,255,255,0.1)'
  // };

  // （移除了新增/编辑/导出等未用函数）

  // 统计数据
  const stats = {
    totalUsers: userRecords.length,
    activeUsers: userRecords.filter(user => user.status === 'active').length,
    totalArticles: 15,
    totalStudyTime: Math.round(userRecords.reduce((total, user) => total + user.totalStudyTime, 0) / 60), // 转换为小时
    averageCompletionRate: Math.round(userRecords.reduce((total, user) => total + user.completedArticles, 0) / userRecords.length),
    averageScore: Math.round(userRecords.reduce((total, user) => total + user.averageScore, 0) / userRecords.length)
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' }}>
      {/* 左侧导航栏 */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '240px',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        transition: 'width 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* 收缩按钮 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            right: '-15px',
            top: '20px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            zIndex: 1
          }}
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        {/* Logo区域 */}
        <div style={{
          padding: sidebarCollapsed ? '20px 10px' : '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          {!sidebarCollapsed && (
            <h2 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>兴站智训通</h2>
          )}
          {sidebarCollapsed && (
            <span style={{ color: '#fff', fontSize: '20px' }}>📚</span>
          )}
        </div>

        {/* 导航菜单 */}
        <nav style={{ 
          flex: 1, 
          padding: '10px 0', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {[
            { id: 'overview', icon: '📊', label: '概览' },
            { id: 'users', icon: '👥', label: '用户学习总览' },
            { id: 'user-management', icon: '🔑', label: '用户管理' },
            { id: 'article-records', icon: '📝', label: '学习记录查询' },
            { id: 'articles', icon: '📚', label: '文章管理' },
            { id: 'statistics', icon: '📈', label: '统计分析' },
            { id: 'photos', icon: '📷', label: '照片管理' },
            { id: 'settings', icon: '⚙️', label: '系统设置' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              style={{
                width: '100%',
                padding: sidebarCollapsed ? '12px' : '12px 20px',
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeTab === item.id ? '3px solid #409eff' : '3px solid transparent',
                color: activeTab === item.id ? '#409eff' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {sidebarCollapsed && activeTab === item.id && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  marginLeft: '10px',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}>
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* 底部返回按钮 */}
        <div style={{ 
          padding: sidebarCollapsed ? '10px' : '10px 20px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 'auto',
          flexShrink: 0
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            title="返回首页"
          >
            <span>🚪</span>
            {!sidebarCollapsed && <span>返回首页</span>}
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ 
        flex: 1,
        padding: isMobile ? '15px' : '20px',
        overflowY: 'auto',
        position: 'relative',
        color: '#fff'
      }}>
        {/* 总览页面 */}
        {activeTab === 'overview' && (
          <div>
            {/* 统计卡片 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
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
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>总用户数</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalUsers}</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  活跃用户：{stats.activeUsers}
                </div>
              </div>

              <div style={{
                background: 'rgba(103, 194, 58, 0.2)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(103, 194, 58, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>文章总数</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalArticles}</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  平均完成率：{stats.averageCompletionRate}%
                </div>
              </div>

              <div style={{
                background: 'rgba(230, 162, 60, 0.2)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(230, 162, 60, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>总学习时长</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalStudyTime}h</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  平均成绩：{stats.averageScore}分
                </div>
              </div>
            </div>

            {/* 最近活动 */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '20px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>最近活动</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <span>张三 完成了《铁路安全操作规程》学习</span>
                  <span style={{ opacity: 0.8 }}>2024-01-15 14:30</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <span>李四 开始学习《设备维护保养指南》</span>
                  <span style={{ opacity: 0.8 }}>2024-01-15 13:45</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <span>王五 完成了《应急处理流程》测试</span>
                  <span style={{ opacity: 0.8 }}>2024-01-15 12:20</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户管理页面 */}
        {activeTab === 'user-management' && (
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>🔑 用户账号管理</h3>
            <Suspense fallback={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                fontSize: '16px',
                color: '#fff'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#409eff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 10px'
                  }}></div>
                  加载用户管理模块...
                </div>
              </div>
            }>
              <UserManagement currentUser={_user} />
            </Suspense>
          </div>
        )}

        {/* 其他页面内容保持不变... */}
        {activeTab === 'users' && (
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>👥 用户学习总览</h3>
            <p>用户学习数据统计和管理功能</p>
          </div>
        )}

        {activeTab === 'article-records' && (
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>📝 学习记录查询</h3>
            <ArticleLearningRecords currentUser={_user} />
          </div>
        )}

        {activeTab === 'articles' && (
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>📚 文章管理</h3>
            <p>文章内容管理功能</p>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>📈 统计分析</h3>
            <p>数据统计和分析功能</p>
          </div>
        )}

        {activeTab === 'photos' && (
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>📷 照片管理</h3>
            <p>学习监控照片管理功能</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>⚙️ 系统设置</h3>
            <p>系统配置和参数设置</p>
          </div>
        )}
      </div>

      {/* 添加旋转动画 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminPanelEnhanced;

