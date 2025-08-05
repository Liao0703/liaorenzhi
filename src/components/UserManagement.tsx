import React, { useState, useEffect } from 'react';
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

interface UserManagementProps {
  currentUser: any;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser: _currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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

  // 部门选项
  const departments = ['机务段', '车务段', '工务段', '电务段', '车辆段', '供电段', 'IT部门', '管理部门', '安全部门'];
  
  // 工种选项
  const jobTypes = ['司机', '调度员', '信号工', '检车员', '线路工', '电气化工', '系统管理员', '安全员', '管理员'];
  
  // 单位选项
  const companies = ['铁路局', '机务段', '车务段', '工务段', '电务段', '车辆段', '供电段'];

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAll();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 生成工号
  const generateEmployeeId = () => {
    const existing = users.map(u => u.employee_id).filter(Boolean);
    let newId = 10001;
    while (existing.includes(newId.toString().padStart(5, '0'))) {
      newId++;
    }
    return newId.toString().padStart(5, '0');
  };

  // 打开添加用户表单
  const handleAdd = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      full_name: '',
      role: 'user',
      employee_id: generateEmployeeId(),
      department: departments[0],
      team: '',
      job_type: jobTypes[0],
      company: companies[0],
      email: '',
      phone: ''
    });
    setEditingUser(null);
    setShowForm(true);
  };

  // 打开编辑用户表单
  const handleEdit = (user: User) => {
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      full_name: user.full_name || '',
      role: user.role,
      employee_id: user.employee_id || '',
      department: user.department || departments[0],
      team: user.team || '',
      job_type: user.job_type || jobTypes[0],
      company: user.company || companies[0],
      email: user.email || '',
      phone: user.phone || ''
    });
    setEditingUser(user);
    setShowForm(true);
  };

  // 保存用户
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (editingUser) {
        // 更新用户
        const response = await userAPI.update(editingUser.id.toString(), formData);
        if (response.success) {
          await loadUsers();
          setShowForm(false);
          alert('用户更新成功！');
        } else {
          alert('更新失败: ' + response.error);
        }
      } else {
        // 创建用户
        const response = await userAPI.create(formData);
        if (response.success) {
          await loadUsers();
          setShowForm(false);
          alert('用户创建成功！');
        } else {
          alert('创建失败: ' + response.error);
        }
      }
    } catch (error: any) {
      alert('操作失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '系统管理员';
      case 'maintenance': return '维护人员';
      case 'user': return '普通用户';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ff4757';
      case 'maintenance': return '#3742fa';
      case 'user': return '#2ed573';
      default: return '#57606f';
    }
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      padding: '20px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>👥 用户账号管理</h3>
        <button
          onClick={handleAdd}
          disabled={loading}
          style={{
            padding: '8px 18px',
            background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: loading ? 0.7 : 1
          }}
        >
          ➕ 添加用户
        </button>
      </div>

      {/* 用户列表 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>工号</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>用户名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>姓名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>角色</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>部门</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>班组</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>工种</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>单位</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>
                  暂无用户数据
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      {user.employee_id || '-'}
                    </code>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.username}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <div>{user.full_name || user.name}</div>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <span style={{
                      background: getRoleColor(user.role),
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px'
                    }}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.department || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.team || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.job_type || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.company || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(64, 158, 255, 0.8)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 用户表单弹窗 */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            padding: '25px',
            borderRadius: '20px',
            width: '95%',
            maxWidth: '700px',
            maxHeight: '85vh',
            overflowY: 'auto',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            margin: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h4 style={{ 
                margin: 0, 
                fontSize: '18px',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {editingUser ? '✏️ 编辑用户' : '➕ 添加用户'}
              </h4>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '15px',
              maxHeight: '60vh',
              overflowY: 'auto',
              paddingRight: '10px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '12px',
                  color: '#fff',
                  fontWeight: '500'
                }}>用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  disabled={!!editingUser}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    opacity: editingUser ? 0.6 : 1
                  }}
                  onFocus={(e) => {
                    if (!editingUser) {
                      e.target.style.borderColor = '#409eff';
                      e.target.style.boxShadow = '0 0 0 2px rgba(64, 158, 255, 0.2)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="请输入用户名"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '12px',
                  color: '#fff',
                  fontWeight: '500'
                }}>
                  {editingUser ? '新密码（留空不修改）' : '密码'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#409eff';
                    e.target.style.boxShadow = '0 0 0 2px rgba(64, 158, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder={editingUser ? '留空不修改密码' : '请输入密码'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  placeholder="姓名"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>全名</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  placeholder="全名"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>工号</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={e => setFormData({...formData, employee_id: e.target.value})}
                  maxLength={5}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  placeholder="如: 12345"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '12px',
                  color: '#fff',
                  fontWeight: '500'
                }}>角色</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'maintenance' | 'user'})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#409eff';
                    e.target.style.boxShadow = '0 0 0 2px rgba(64, 158, 255, 0.2)';
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

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>部门</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '12px',
                  color: '#fff',
                  fontWeight: '500'
                }}>班组</label>
                <input
                  type="text"
                  value={formData.team}
                  onChange={e => setFormData({...formData, team: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#409eff';
                    e.target.style.boxShadow = '0 0 0 2px rgba(64, 158, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="请输入班组名称"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>工种</label>
                <select
                  value={formData.job_type}
                  onChange={e => setFormData({...formData, job_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                >
                  {jobTypes.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>单位</label>
                <select
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                >
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  placeholder="邮箱"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  placeholder="手机号"
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginTop: '20px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '12px 25px',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ❌ 取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !formData.username || (!editingUser && !formData.password)}
                style={{
                  padding: '12px 25px',
                  background: loading || !formData.username || (!editingUser && !formData.password)
                    ? 'rgba(255,255,255,0.3)'
                    : 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: loading || !formData.username || (!editingUser && !formData.password) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: loading || !formData.username || (!editingUser && !formData.password) 
                    ? 'none' 
                    : '0 4px 15px rgba(64, 158, 255, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!loading && formData.username && (editingUser || formData.password)) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(64, 158, 255, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && formData.username && (editingUser || formData.password)) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(64, 158, 255, 0.3)';
                  }
                }}
              >
                {loading ? '⏳ 保存中...' : '✅ 保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 