import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import bgImg from './assets/station-bg.jpg';
import logoImg from './assets/logo.png';
import Login from './Login';
import Dashboard from './Dashboard';
import ArticleList from './ArticleList';
import ArticleReader from './ArticleReader';
import AdminPanel from './AdminPanel';
import DataSyncStatus from './DataSyncStatus';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟用户登录状态检查
    const checkUserLogin = () => {
      const savedUser = localStorage.getItem('learning_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };

    checkUserLogin();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('learning_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('learning_user');
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
