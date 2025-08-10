import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from './config/api';
import LeaderBoard from './components/LeaderBoard';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    department: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // 基本验证
    if (!formData.username || !formData.password || !formData.name) {
      setError('请填写所有必填字段');
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('用户名至少需要3个字符');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少需要6个字符');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'user' // 默认角色为普通用户
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('注册成功！3秒后自动跳转到登录页面...');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(result.error || '注册失败，请重试');
      }
    } catch (error: any) {
      console.error('注册请求失败:', error);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LeaderBoard position="login" />
      <form className="login-form-bg" onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>用户注册</h2>
        
        <input
          type="text"
          name="username"
          placeholder="用户名 *"
          value={formData.username}
          onChange={handleChange}
          required
          minLength={3}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            background: '#fff2',
            color: '#fff'
          }}
        />
        
        <input
          type="password"
          name="password"
          placeholder="密码 *（至少6位）"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            background: '#fff2',
            color: '#fff'
          }}
        />
        
        <input
          type="text"
          name="name"
          placeholder="真实姓名 *"
          value={formData.name}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            background: '#fff2',
            color: '#fff'
          }}
        />
        
        <input
          type="email"
          name="email"
          placeholder="邮箱地址"
          value={formData.email}
          onChange={handleChange}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            background: '#fff2',
            color: '#fff'
          }}
        />
        
        <input
          type="tel"
          name="phone"
          placeholder="手机号"
          value={formData.phone}
          onChange={handleChange}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            background: '#fff2',
            color: '#fff'
          }}
        />
        
        <input
          type="text"
          name="department"
          placeholder="部门"
          value={formData.department}
          onChange={handleChange}
          style={{
            width: '100%',
            marginBottom: 20,
            padding: 12,
            borderRadius: 8,
            border: 'none',
            fontSize: 16,
            background: '#fff2',
            color: '#fff'
          }}
        />

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

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            background: isLoading 
              ? 'rgba(64, 158, 255, 0.6)' 
              : 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
            color: '#fff',
            fontSize: 18,
            border: 'none',
            marginBottom: 16,
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '注册中...' : '注册账户'}
        </button>

        {/* 返回登录链接 */}
        <div style={{ 
          textAlign: 'center',
          fontSize: 14
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
            已有账户？返回登录
          </Link>
        </div>
      </form>
    </>
  );
};

export default Register;