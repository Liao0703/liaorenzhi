import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LeaderBoard from './components/LeaderBoard';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'input' | 'sent' | 'reset'>('input');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email && !formData.username) {
      setError('请输入邮箱地址或用户名');
      setIsLoading(false);
      return;
    }

    try {
      // 这里应该调用发送验证码的API
      // 由于这是演示，我们模拟一个成功的响应
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('验证码已发送到您的邮箱，请查收');
      setStep('sent');
    } catch (error: any) {
      setError('发送验证码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.verificationCode || !formData.newPassword || !formData.confirmPassword) {
      setError('请填写所有字段');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('密码至少需要6个字符');
      setIsLoading(false);
      return;
    }

    try {
      // 这里应该调用重置密码的API
      // 由于这是演示，我们模拟一个成功的响应
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('密码重置成功！3秒后自动跳转到登录页面...');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error: any) {
      setError('密码重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputStep = () => (
    <form onSubmit={handleSendVerification}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>忘记密码</h2>
      <p style={{ color: '#fff8', textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>
        请输入您的邮箱地址或用户名，我们将发送重置密码的验证码到您的邮箱
      </p>
      
      <div className="input-wrap">
        <input
          type="text"
          name="email"
          placeholder="邮箱地址或用户名"
          value={formData.email}
          onChange={handleChange}
          required
          className="login-input"
        />
      </div>

      <button type="submit" disabled={isLoading} className="primary-btn">
        {isLoading ? '发送中...' : '发送验证码'}
      </button>
    </form>
  );

  const renderSentStep = () => (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>验证码已发送</h2>
      <p style={{ color: '#fff8', textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>
        验证码已发送到您的邮箱，请查收并输入验证码和新密码
      </p>
      
      <form onSubmit={handleResetPassword}>
        <div className="input-wrap">
          <input
            type="text"
            name="verificationCode"
            placeholder="验证码"
            value={formData.verificationCode}
            onChange={handleChange}
            required
            className="login-input"
          />
        </div>
        
        <div className="input-wrap">
          <input
            type="password"
            name="newPassword"
            placeholder="新密码（至少6位）"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength={6}
            className="login-input"
          />
        </div>
        
        <div className="input-wrap">
          <input
            type="password"
            name="confirmPassword"
            placeholder="确认新密码"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="login-input"
          />
        </div>

        <button type="submit" disabled={isLoading} className="primary-btn">
          {isLoading ? '重置中...' : '重置密码'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', fontSize: 14 }}>
        <button
          onClick={() => setStep('input')}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff9',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          重新发送验证码
        </button>
      </div>
    </div>
  );

  return (
    <>
      <LeaderBoard position="login" />
      <div className="login-form-bg" style={{ maxWidth: '400px', margin: '0 auto' }}>
        {step === 'input' && renderInputStep()}
        {step === 'sent' && renderSentStep()}

        {error && (
          <div style={{
            color: '#ff6b6b',
            marginBottom: 16,
            textAlign: 'center',
            fontSize: 14,
            background: 'rgba(255, 107, 107, 0.1)',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            color: '#4caf50',
            marginBottom: 16,
            textAlign: 'center',
            fontSize: 14,
            background: 'rgba(76, 175, 80, 0.1)',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            {success}
          </div>
        )}

        {/* 返回登录链接 */}
        <div style={{ 
          textAlign: 'center',
          fontSize: 14,
          marginTop: 16
        }}>
          <Link 
            to="/"
            style={{ 
              color: '#fff9', 
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = '#fff9'}
          >
            返回登录页面
          </Link>
        </div>

        {/* 注意事项 */}
        <div style={{ 
          color: '#fff6', 
          fontSize: 12, 
          textAlign: 'center', 
          marginTop: 20,
          padding: '8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ marginBottom: 4, fontWeight: 'bold', color: '#ff9800' }}>💡 演示说明</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            这是一个密码重置功能的演示界面。在实际部署中，需要配置邮件服务来发送真实的验证码。
            目前可以输入任意验证码来测试重置流程。
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;