import React, { useState, useEffect } from 'react';
import { userAPI } from '../config/api';

// 扩展Window接口
declare global {
  interface Window {
    refreshUserList?: () => void;
  }
}

interface User {
  id: number;
  username: string;
  name: string;
  full_name?: string;
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
    employee_id: '',
    department: '白市驿车站',
    team: '',
    job_type: '',
    company: '兴隆村车站',
    email: '',
    phone: ''
  });

  // 班组选项
  const teams = ['运转一班', '运转二班', '运转三班', '运转四班'];
  
  // 工种选项
  const jobTypes = ['车站值班员', '助理值班员（内勤）', '助理值班员（外勤）', '连结员', '调车长', '列尾作业员', '站调', '车号员'];

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
    // 为全局设置刷新函数
    window.refreshUserList = loadUsers;
    
    // 清理函数
    return () => {
      if (window.refreshUserList === loadUsers) {
        delete window.refreshUserList;
      }
    };
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

  // 打开新窗口添加用户
  const handleAdd = () => {
    const width = 1200;
    const height = 800;
    const left = Math.floor((screen.width - width) / 2);
    const top = Math.floor((screen.height - height) / 2);
    
    const newWindow = window.open(
      './add-user-window.html',
      'addUser',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no`
    );
    
    if (!newWindow) {
      const useInline = window.confirm('无法打开新窗口，可能被浏览器阻止了。\n\n点击"确定"使用内联表单添加用户，\n点击"取消"查看解决方案。');
      if (useInline) {
        // 备用方案：使用内联表单
        setFormData({
          username: '',
          password: '',
          name: '',
          full_name: '',
          employee_id: generateEmployeeId(),
          department: '白市驿车站',
          team: teams[0],
          job_type: jobTypes[0],
          company: '兴隆村车站',
          email: '',
          phone: ''
        });
        setEditingUser(null);
        setShowForm(true);
      } else {
        alert('解决方案：\n1. 点击地址栏右侧的弹窗图标\n2. 选择"始终允许此网站的弹出式窗口"\n3. 重新点击添加用户按钮');
      }
    }
  };

  // 打开编辑用户表单或新窗口
  const handleEdit = (user: User) => {
    const width = 1200;
    const height = 800;
    const left = Math.floor((screen.width - width) / 2);
    const top = Math.floor((screen.height - height) / 2);
    
    // 构建URL参数
    const params = new URLSearchParams({
      id: user.id.toString(),
      username: user.username || '',
      name: user.name || '',
      full_name: user.full_name || '',
      employee_id: user.employee_id || '',
      department: '白市驿车站',
      team: user.team || teams[0],
      job_type: user.job_type || jobTypes[0],
      company: '兴隆村车站',
      email: user.email || '',
      phone: user.phone || ''
    });
    
    const newWindow = window.open(
      `./edit-user-window.html?${params.toString()}`,
      'editUser',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no`
    );
    
    if (!newWindow) {
      const useInline = window.confirm('无法打开新窗口，可能被浏览器阻止了。\n\n点击"确定"使用内联表单编辑用户，\n点击"取消"查看解决方案。');
      if (useInline) {
        // 备用方案：使用内联表单
        setFormData({
          username: user.username,
          password: '',
          name: user.name,
          full_name: user.full_name || '',
          employee_id: user.employee_id || '',
          department: '白市驿车站',
          team: user.team || teams[0],
          job_type: user.job_type || jobTypes[0],
          company: '兴隆村车站',
          email: user.email || '',
          phone: user.phone || ''
        });
        setEditingUser(user);
        setShowForm(true);
      } else {
        alert('解决方案：\n1. 点击地址栏右侧的弹窗图标\n2. 选择"始终允许此网站的弹出式窗口"\n3. 重新点击编辑按钮');
      }
    }
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
        // 创建用户 - 添加默认role
        const userData = { ...formData, role: 'user' };
        const response = await userAPI.create(userData);
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



  // 统一白底卡片与子卡片样式
  const lightCard: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #eef0f4',
    borderRadius: 16,
    boxShadow: '0 6px 24px rgba(17,24,39,0.06)'
  };
  const subCard: React.CSSProperties = {
    background: '#f8fafc',
    border: '1px solid #eef2f7',
    borderRadius: 10
  };

  return (
    <div style={{ ...lightCard, padding: 20, color: '#111827' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>👥 用户账号管理</h3>
        <button
          onClick={handleAdd}
          disabled={loading}
          style={{
            padding: '8px 14px',
            background: '#111827',
            color: '#fff',
            border: '1px solid #111827',
            borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
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
          backgroundColor: '#fff',
          border: '1px solid #eef0f4',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(17,24,39,0.06)',
          color: '#111827'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>工号</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>姓名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>电话</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>单位</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>部门</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>班组</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>工种</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#111827' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center' }}>
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center' }}>
                  暂无用户数据
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                      {user.employee_id || '-'}
                    </code>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', fontWeight: 600 }}>
                    {user.full_name || user.name}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.phone || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>兴隆村车站</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>白市驿车站</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.team || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.job_type || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        padding: '6px 10px',
                        background: '#111827',
                        color: '#fff',
                        border: '1px solid #111827',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600
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
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #eef0f4',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(17,24,39,0.12)',
            padding: 20,
            width: '95%',
            maxWidth: '700px',
            maxHeight: '85vh',
            overflowY: 'auto',
            color: '#111827',
            margin: 20
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {editingUser ? '✏️ 编辑用户' : '➕ 添加用户'}
              </h4>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#111827',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: 5,
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
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
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#111827', fontWeight: 600 }}>用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  disabled={!!editingUser}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s ease',
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
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#111827', fontWeight: 600 }}>
                  {editingUser ? '新密码（留空不修改）' : '密码'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s ease',
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
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14
                  }}
                  placeholder="姓名"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>全名</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14
                  }}
                  placeholder="全名"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>工号</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={e => setFormData({...formData, employee_id: e.target.value})}
                  maxLength={5}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14
                  }}
                  placeholder="如: 12345"
                />
              </div>



              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>部门</label>
                <input
                  type="text"
                  value="白市驿车站"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14,
                    opacity: 0.8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#111827', fontWeight: 600 }}>班组</label>
                <select
                  value={formData.team}
                  onChange={e => setFormData({...formData, team: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14
                  }}
                >
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>工种</label>
                <select
                  value={formData.job_type}
                  onChange={e => setFormData({...formData, job_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14
                  }}
                >
                  {jobTypes.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>单位</label>
                <input
                  type="text"
                  value="兴隆村车站"
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14,
                    opacity: 0.8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14
                  }}
                  placeholder="邮箱"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14
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
                  padding: '8px 14px',
                  background: '#fff',
                  color: '#111827',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                ❌ 取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !formData.username || (!editingUser && !formData.password)}
                style={{
                  padding: '8px 14px',
                  background: loading || !formData.username || (!editingUser && !formData.password) ? '#9ca3af' : '#111827',
                  color: '#fff',
                  border: '1px solid #111827',
                  borderRadius: 10,
                  cursor: loading || !formData.username || (!editingUser && !formData.password) ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600
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