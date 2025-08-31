import React, { useState } from 'react';
import { userAPI } from '../config/api';

interface User {
  id: number;
  username: string;
  name: string;
  full_name?: string;
  role: 'admin' | 'maintenance' | 'user';
  employee_id?: string;
  department?: string;
  team?: string;
  job_type?: string;
  company?: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

const AddUserWindow: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    full_name: '',
    role: 'user' as 'admin' | 'maintenance' | 'user',
    employee_id: '',
    department: '',
    team: '',
    job_type: '',
    company: '',
    email: '',
    phone: ''
  });

  // 部门选项（与全局统一）
  const departments = ['团结村车站','白市驿车站','陶家场线路所','铜罐驿车站','石场车站','中梁山','跳蹬车站','珞璜车站','小南海车站','伏牛溪车站','茄子溪车站','大渡口车站','重庆南车站'];
  
  // 工种选项
  const jobTypes = ['司机', '调度员', '信号工', '检车员', '线路工', '电气化工', '系统管理员', '安全员', '管理员'];
  
  // 单位选项
  const companies = ['铁路局', '机务段', '车务段', '工务段', '电务段', '车辆段', '供电段', '通信段', '建设段'];

  const handleSave = async () => {
    if (!formData.username || !formData.password) {
      setMessage({ type: 'error', text: '用户名和密码为必填项' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await userAPI.create(formData);
      setMessage({ type: 'success', text: '用户添加成功！' });
      
      // 清空表单
      setFormData({
        username: '',
        password: '',
        name: '',
        full_name: '',
        role: 'user',
        employee_id: '',
        department: '',
        team: '',
        job_type: '',
        company: '',
        email: '',
        phone: ''
      });

      // 3秒后提示用户可以关闭窗口
      setTimeout(() => {
        setMessage({ type: 'success', text: '用户添加成功！您可以关闭此窗口返回用户管理页面。' });
      }, 3000);

    } catch (error: any) {
      console.error('添加用户失败:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '添加用户失败，请重试' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (window.confirm('确定要关闭窗口吗？未保存的数据将丢失。')) {
      window.close();
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '20px 30px',
        marginBottom: '25px',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '26px', 
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '1px'
          }}>
            ➕ 添加新用户
          </h1>
          <p style={{ 
            margin: '8px 0 0 0', 
            opacity: 0.9, 
            fontSize: '14px' 
          }}>
            请填写完整的用户信息
          </p>
        </div>
        <button
          onClick={handleClose}
          style={{
            padding: '10px 20px',
            background: 'rgba(255, 71, 87, 0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 71, 87, 1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 71, 87, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ✕ 关闭窗口
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{
          background: message.type === 'success' 
            ? 'rgba(46, 204, 113, 0.9)' 
            : 'rgba(231, 76, 60, 0.9)',
          color: '#fff',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}>
          {message.text}
        </div>
      )}

      {/* 表单内容 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        padding: '40px',
        borderRadius: '20px',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '25px',
          marginBottom: '30px'
        }}>
          {/* 用户名 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>用户名 *</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入用户名"
            />
          </div>

          {/* 密码 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>密码 *</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入密码"
            />
          </div>

          {/* 姓名 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>姓名</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入姓名"
            />
          </div>

          {/* 全名 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>全名</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入全名"
            />
          </div>

          {/* 工号 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>工号</label>
            <input
              type="text"
              value={formData.employee_id}
              onChange={e => setFormData({...formData, employee_id: e.target.value})}
              maxLength={5}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入5位工号"
            />
          </div>

          {/* 角色 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>角色</label>
            <select
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'maintenance' | 'user'})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="user" style={{ background: '#2c3e50', color: '#fff' }}>普通用户</option>
              <option value="maintenance" style={{ background: '#2c3e50', color: '#fff' }}>维护人员</option>
              <option value="admin" style={{ background: '#2c3e50', color: '#fff' }}>系统管理员</option>
            </select>
          </div>

          {/* 部门 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>部门</label>
            <select
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="" style={{ background: '#2c3e50', color: '#fff' }}>请选择部门</option>
              {departments.map(dept => (
                <option key={dept} value={dept} style={{ background: '#2c3e50', color: '#fff' }}>{dept}</option>
              ))}
            </select>
          </div>

          {/* 班组 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>班组</label>
            <input
              type="text"
              value={formData.team}
              onChange={e => setFormData({...formData, team: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入班组名称"
            />
          </div>

          {/* 工种 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>工种</label>
            <select
              value={formData.job_type}
              onChange={e => setFormData({...formData, job_type: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="" style={{ background: '#2c3e50', color: '#fff' }}>请选择工种</option>
              {jobTypes.map(job => (
                <option key={job} value={job} style={{ background: '#2c3e50', color: '#fff' }}>{job}</option>
              ))}
            </select>
          </div>

          {/* 单位 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>单位</label>
            <select
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="" style={{ background: '#2c3e50', color: '#fff' }}>请选择单位</option>
              {companies.map(company => (
                <option key={company} value={company} style={{ background: '#2c3e50', color: '#fff' }}>{company}</option>
              ))}
            </select>
          </div>

          {/* 邮箱 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入邮箱地址"
            />
          </div>

          {/* 手机号 */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '14px',
              color: '#fff',
              fontWeight: '600'
            }}>手机号</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#409eff';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 158, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入手机号"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <button
            onClick={() => {
              if (window.confirm('确定要重置表单吗？')) {
                setFormData({
                  username: '',
                  password: '',
                  name: '',
                  full_name: '',
                  role: 'user',
                  employee_id: '',
                  department: '',
                  team: '',
                  job_type: '',
                  company: '',
                  email: '',
                  phone: ''
                });
                setMessage(null);
              }
            }}
            style={{
              padding: '15px 30px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🔄 重置表单
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !formData.username || !formData.password}
            style={{
              padding: '15px 40px',
              background: loading || !formData.username || !formData.password
                ? 'rgba(255,255,255,0.3)'
                : 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '30px',
              cursor: loading || !formData.username || !formData.password ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: loading || !formData.username || !formData.password 
                ? 'none' 
                : '0 6px 20px rgba(64, 158, 255, 0.4)'
            }}
            onMouseOver={(e) => {
              if (!loading && formData.username && formData.password) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(64, 158, 255, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading && formData.username && formData.password) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(64, 158, 255, 0.4)';
              }
            }}
          >
            {loading ? '⏳ 添加中...' : '✅ 添加用户'}
          </button>
        </div>
      </div>

      {/* 底部提示 */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '13px'
      }}>
        <p>* 标记为必填项 | 添加成功后请关闭此窗口返回用户管理页面</p>
      </div>
    </div>
  );
};

export default AddUserWindow;