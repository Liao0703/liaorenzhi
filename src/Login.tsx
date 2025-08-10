import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from './config/api';
import LeaderBoard from './components/LeaderBoard';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await authAPI.login(username, password);
      
      console.log('登录响应:', data);

      // 检查响应是否成功
      if (data.success === false) {
        setError(data.error || '登录失败');
        return;
      }

      // 保存token到localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        onLoginSuccess(data.user);
      } else {
        setError('登录响应无效');
      }
    } catch (error: any) {
      console.error('登录请求错误:', error);
      setError(error.message || '网络错误，请重试');
    }
  };

  return (
    <>
      <LeaderBoard position="login" />
      <form className="login-form-bg" onSubmit={handleLogin}>
      <h2>班前学习监督系统</h2>
      <input
        type="text"
        placeholder="用户名"
        value={username}
        onChange={e => setUsername(e.target.value)}
        autoComplete="username"
        style={{
          width: '100%',
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
          border: 'none',
          fontSize: 18,
          background: '#fff2',
          color: '#fff'
        }}
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
        style={{
          width: '100%',
          marginBottom: 18,
          padding: 12,
          borderRadius: 8,
          border: 'none',
          fontSize: 18,
          background: '#fff2',
          color: '#fff'
        }}
      />
      {error && (
        <div style={{
          color: '#ff6b6b',
          marginBottom: 16,
          textAlign: 'center',
          fontSize: 14
        }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
          color: '#fff',
          fontSize: 18,
          border: 'none',
          marginBottom: 16,
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        登录
      </button>
      
      {/* 忘记密码和注册链接 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20,
        fontSize: 14
      }}>
        <Link 
          to="/forgot-password"
          style={{ 
            color: '#fff9', 
            textDecoration: 'none',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = '#fff9'}
        >
          忘记密码？
        </Link>
        <Link 
          to="/register"
          style={{ 
            color: '#fff9', 
            textDecoration: 'none',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = '#fff9'}
        >
          注册账户
        </Link>
      </div>
      
      <div style={{ color: '#fff8', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 8, padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: 4, fontWeight: 'bold', color: '#ff9800' }}>🔑 测试账号（统一密码）</div>
          <div style={{ marginBottom: 2, color: '#f44336' }}>👑 <strong>系统管理员</strong>: admin / 123456</div>
          <div style={{ marginBottom: 2, color: '#2196f3' }}>🔧 <strong>维护人员</strong>: maintenance / 123456</div>
          <div style={{ marginBottom: 2, color: '#4caf50' }}>👤 <strong>普通用户</strong>: user / 123456</div>
          <div style={{ color: '#9c27b0' }}>👑 <strong>测试管理员</strong>: testadmin / 123456</div>
          <div style={{ marginTop: 6, fontSize: 9, opacity: 0.6, fontStyle: 'italic' }}>所有账号密码已统一为 123456，不同角色拥有不同的系统权限</div>
        </div>
      </div>
    </form>
    </>
  );
};

export default Login;