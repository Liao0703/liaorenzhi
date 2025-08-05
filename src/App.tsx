import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import bgImg from './assets/station-bg.jpg';
import logoImg from './assets/logo.png';
import Login from './Login';
import Dashboard from './Dashboard';
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
import MaintenanceTest from './MaintenanceTest';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    // 检查用户登录状态
    const checkUserLogin = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // 验证token是否有效
          const response = await fetch(`${window.location.hostname === '116.62.65.246' ? 'http://116.62.65.246:3001' : 'http://localhost:3001'}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('learning_user', JSON.stringify(data.user));
          } else {
            // token无效，清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('learning_user');
          }
        } catch (error) {
          console.error('验证登录状态失败:', error);
          // 网络错误时检查本地存储的用户信息
          const savedUser = localStorage.getItem('learning_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
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
    setUser(userData);
    localStorage.setItem('learning_user', JSON.stringify(userData));
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
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh', minWidth: '100vw', overflow: 'hidden', paddingBottom: 60 }}>
        <img src={bgImg} alt="背景图" className="bg" />
        <div className="logo-bar">
          <img src={logoImg} alt="logo" />
          <span style={{ color: '#fff', fontSize: 26, letterSpacing: 4, fontWeight: 500, textShadow: '0 2px 8px #0007' }}>
            兴隆场车站 XINGLONGCHANG RAILWAY STATION
          </span>
        </div>

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
            path="/dashboard"
            element={
              user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
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

        {/* 数据同步状态显示 */}
        <DataSyncStatus />

        {/* 版权信息栏 */}
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
    </Router>
  );
}

export default App;
