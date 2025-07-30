import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import bgImg from './assets/station-bg.jpg';
import logoImg from './assets/logo.png';
import Login from './Login';
import Dashboard from './Dashboard';
import ArticleList from './ArticleList';
import ArticleReader from './ArticleReader';
import AdminPanel from './AdminPanel';

const App: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleLoginSuccess = (user: any) => {
    setLoggedIn(true);
    setCurrentUser(user);
    console.log('登录成功，用户信息：', user);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser(null);
  };

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
              loggedIn ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
            }
          />
          <Route
            path="/dashboard"
            element={
              loggedIn ? <Dashboard user={currentUser} onLogout={handleLogout} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/articles"
            element={
              loggedIn ? <ArticleList user={currentUser} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/article/:id"
            element={
              loggedIn ? <ArticleReader user={currentUser} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin"
            element={
              loggedIn && currentUser?.role === 'admin' ? <AdminPanel user={currentUser} /> : <Navigate to="/dashboard" replace />
            }
          />
        </Routes>

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
};

export default App;
