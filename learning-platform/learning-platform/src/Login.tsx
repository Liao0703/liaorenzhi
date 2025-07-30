import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 模拟用户数据
    const users = {
      'admin': { id: 1, username: 'admin', name: '管理员', role: 'admin' },
      'user1': { id: 2, username: 'user1', name: '张三', role: 'user' },
      'user2': { id: 3, username: 'user2', name: '李四', role: 'user' },
      'user3': { id: 4, username: 'user3', name: '王五', role: 'user' }
    };
    
    if (users[username as keyof typeof users] && password === '123456') {
      console.log('登录验证成功');
      onLoginSuccess(users[username as keyof typeof users]);
    } else {
      setError('用户名或密码错误');
      console.log('登录验证失败');
    }
  };

  return (
    <form className="login-form-bg" onSubmit={handleLogin}>
      <h2>班前学习监督系统</h2>
      <input
        type="text"
        placeholder="用户名"
        value={username}
        onChange={e => setUsername(e.target.value)}
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
      <div style={{ 
        color: '#fff8', 
        fontSize: 12, 
        textAlign: 'center',
        marginTop: 8
      }}>
        测试账号：admin/123456 (管理员) | user1/123456 (职工)
      </div>
    </form>
  );
};

export default Login;
