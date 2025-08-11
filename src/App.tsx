import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import bgImg from './assets/station-bg.jpg';
import logoImg from './assets/logo.png';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import Dashboard from './Dashboard';
import RoleHome from './RoleHome';
import ArticleList from './ArticleList';
import ArticleReader from './ArticleReader';
import AdminPanel from './AdminPanel';
import MaintenanceAdminPanel from './MaintenanceAdminPanel';
import MaintenanceAdminTest from './MaintenanceAdminTest';
import MaintenanceAdminSimple from './MaintenanceAdminSimple';
import DataSyncStatus from './DataSyncStatus';
import CameraTest from './CameraTest';
import MaintenancePage from './MaintenancePage';
import { maintenanceService } from './maintenanceService';
import { API_BASE_URL } from './config/api';
import MaintenanceTest from './MaintenanceTest';

const AppContent = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const location = useLocation();
    const isLoginPage = !user && location.pathname === '/';

  useEffect(() => {
    // 检查用户登录状态
    const checkUserLogin = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('learning_user');
      
      console.log('🔍 App启动 - 检查登录状态:', { 
        hasToken: !!token, 
        hasSavedUser: !!savedUser,
        savedUserData: savedUser ? JSON.parse(savedUser) : null 
      });
      
      if (token) {
        try {
          // 验证token是否有效（统一走 API_BASE_URL）
          
          console.log('🌐 正在验证token...');
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ 服务器验证成功 - 用户信息:', data.user);
            
            // 验证角色信息完整性
            if (!data.user.role) {
              console.warn('⚠️ 警告: 服务器返回的用户信息缺少角色字段');
              data.user.role = 'user'; // 默认角色
            }
            
            setUser(data.user);
            localStorage.setItem('learning_user', JSON.stringify(data.user));
            console.log('💾 已更新本地用户数据');
          } else {
            console.error('❌ Token验证失败:', response.status, response.statusText);
            // token无效，清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('learning_user');
            setUser(null);
          }
        } catch (error) {
          console.error('🔥 验证登录状态失败:', error);
          
          // 网络错误时检查本地存储的用户信息
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              console.log('📱 使用本地缓存的用户数据:', userData);
              
              // 验证本地数据完整性
              if (!userData.role) {
                console.warn('⚠️ 警告: 本地用户数据缺少角色字段，设置为默认角色');
                userData.role = 'user';
                localStorage.setItem('learning_user', JSON.stringify(userData));
              }
              
              setUser(userData);
            } catch (parseError) {
              console.error('🔥 解析本地用户数据失败:', parseError);
              localStorage.removeItem('learning_user');
              setUser(null);
            }
          } else {
            console.log('📭 无本地用户数据可用');
            setUser(null);
          }
        }
      } else {
        console.log('🔑 无登录Token');
        // 无token但有本地用户数据的情况
        if (savedUser) {
          console.log('🗑️ 清除无效的本地用户数据');
          localStorage.removeItem('learning_user');
        }
        setUser(null);
      }
      setIsLoading(false);
    };

    // 检查维护模式状态
    const checkMaintenanceMode = () => {
      const maintenanceEnabled = maintenanceService.isMaintenanceMode();
      setIsMaintenanceMode(maintenanceEnabled);
    };

    checkUserLogin();
    checkMaintenanceMode();
  }, []);

  const handleLogin = (userData: any) => {
    console.log('🚀 处理登录成功 - 用户数据:', userData);
    
    // 验证用户数据完整性
    if (!userData.role) {
      console.warn('⚠️ 警告: 登录返回的用户数据缺少角色字段');
      userData.role = 'user'; // 设置默认角色
    }
    
    console.log('👤 设置用户状态:', userData);
    setUser(userData);
    localStorage.setItem('learning_user', JSON.stringify(userData));
    console.log('💾 用户数据已保存到本地存储');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('learning_user');
    localStorage.removeItem('auth_token');
  };

  const handleExitMaintenance = () => {
    setIsMaintenanceMode(false);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>加载中...</div>
          <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
      <div style={{ position: 'relative', minHeight: '100vh', minWidth: '100vw', overflow: 'hidden', paddingBottom: 60, background: '#f5f7fb' }}>
        {/* 登录页使用背景图与logo */}
        {isLoginPage && (
          <>
            <img src={bgImg} alt="背景图" className="bg" />
            <div className="overlay-gradient" />
            <div className="logo-bar">
              <img src={logoImg} alt="logo" />
            </div>
          </>
        )}

        {/* 维护模式页面 */}
        {isMaintenanceMode && (
          <MaintenancePage onExitMaintenance={handleExitMaintenance} />
        )}

        <Routes>
          <Route
            path="/"
            element={
              user ? <Navigate to="/dashboard" replace /> : (
                <Login onLoginSuccess={handleLogin} />
              )
            }
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/dashboard" replace /> : <Register />
            }
          />
          <Route
            path="/forgot-password"
            element={
              user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? <RoleHome user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/articles"
            element={
              user ? <ArticleList user={user} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/article/:id"
            element={
              user ? <ArticleReader user={user} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin"
            element={
              user?.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="/maintenance-admin"
            element={
              user ? (
                (user.role === 'maintenance' || user.role === 'admin') ? 
                  <MaintenanceAdminPanel user={user} onLogout={handleLogout} /> : 
                  <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/maintenance-test"
            element={<MaintenanceAdminTest />}
          />
          <Route
            path="/maintenance-simple"
            element={<MaintenanceAdminSimple user={user} onLogout={handleLogout} />}
          />
          <Route
            path="/camera-test"
            element={
              user ? <CameraTest /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/maintenance-test"
            element={
              user ? <MaintenanceTest /> : <Navigate to="/" replace />
            }
          />
        </Routes>

        {/* 恢复登录页也显示同步状态条 */}
        <DataSyncStatus />

        {/* 版权信息栏 */}
        {/* 恢复登录页也显示页脚 */}
        <footer
          style={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: '100vw',
            background: 'rgba(34, 34, 34, 0.85)',
            color: '#fff',
            textAlign: 'center',
            fontSize: 14,
            letterSpacing: 1,
            padding: '12px 0 10px 0',
            zIndex: 100,
            boxShadow: '0 -2px 12px #0003',
            backdropFilter: 'blur(4px)',
            userSelect: 'none',
          }}
        >
          版权所有 © 2025 兴隆场车站-白市驿车站 保留所有权利
        </footer>
      </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
