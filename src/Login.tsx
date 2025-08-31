import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from './config/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showHelp, setShowHelp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await authAPI.login(username, password);
      
      console.log('登录响应:', data);

      // 检查响应是否成功
      if (data.success === false) {
        const friendlyMessage =
          (typeof data?.statusCode === 'number' && data.statusCode === 401)
            ? '账号或密码错误'
            : (data.error || '登录失败');
        setError(friendlyMessage);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="split-hero">
        <div className="split-left">
          <div className="welcome-big">欢迎使用</div>
          <div className="welcome-small">兴站智训通</div>
        </div>

        <form className="login-form-bg split-right" onSubmit={handleLogin}>
          <div className="input-wrap">
            <input aria-label="用户名" type="text" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" className="login-input" />
          </div>
          <div className="input-wrap">
            <input aria-label="密码" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className="login-input" />
          </div>
          {error && (
            <div style={{ color: '#ff6b6b', marginBottom: 16, textAlign: 'center', fontSize: 14 }}>{error}</div>
          )}
          <button type="submit" className="primary-btn" disabled={isSubmitting}>{isSubmitting ? '登录中…' : '登录'}</button>
          <div className="links-center-row">
            <Link to="/forgot-password" className="subtle-center-link">忘记密码？</Link>
          </div>
          <Link to="/register" className="secondary-btn">创建账户 →</Link>
          <div className="sub-actions">
            <button type="button" className="help-trigger" onClick={() => setShowHelp(true)}>❓ 帮助/说明</button>
            <small style={{color:'#9db4ff', opacity:.8}}>已加密传输</small>
          </div>
          {showHelp && (
            <div className="help-drawer" role="dialog" aria-modal="true">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>帮助与说明</strong>
                <button type="button" className="muted-link" onClick={() => setShowHelp(false)}>关闭 ✕</button>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                如需体验，可使用测试账号登录（统一密码 123456）：
                <div style={{ marginTop: 6 }}>
                  <div>系统管理员：admin</div>
                  <div>维护人员：maintenance</div>
                  <div>普通用户：user</div>
                  <div>测试管理员：testadmin</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <small>提示：正式环境请关闭测试账号并开启强密码策略。</small>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Login;