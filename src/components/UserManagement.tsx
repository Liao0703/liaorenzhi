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
  role?: 'admin' | 'maintenance' | 'user';
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
      console.log('🔄 正在加载用户列表...');
      const token = localStorage.getItem('auth_token');
      console.log('📌 当前Token:', token ? '存在' : '不存在');
      
      const response = await userAPI.getAll();
      console.log('📋 API响应:', response);
      
      if (response.success && response.data) {
        setUsers(response.data);
        console.log('✅ 成功加载', response.data.length, '个用户');
      } else if (response.statusCode === 401) {
        console.error('❌ 认证失败:', response.error);
        alert('认证失败，请重新登录');
        // 可选：重定向到登录页
        // window.location.href = '/';
      } else {
        console.error('❌ 加载失败:', response.error);
        alert('加载用户列表失败: ' + (response.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 加载用户列表异常:', error);
      alert('网络错误，请检查服务器连接');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // 为全局设置刷新函数
    window.refreshUserList = loadUsers;
    
    // 监听来自子窗口的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'USER_DATA_UPDATED') {
        console.log('📨 收到数据更新通知，刷新用户列表');
        loadUsers();
      }
    };
    
    // 监听自定义事件
    const handleUserDataUpdated = () => {
      console.log('🔄 用户数据已更新，刷新列表');
      loadUsers();
    };
    
    // 监听窗口获得焦点事件（从其他窗口切换回来时刷新）
    const handleFocus = () => {
      console.log('🔍 窗口获得焦点，刷新用户列表');
      loadUsers();
    };
    
    window.addEventListener('message', handleMessage);
    window.addEventListener('userDataUpdated', handleUserDataUpdated as EventListener);
    window.addEventListener('focus', handleFocus);
    
    // 可选：定时刷新（每30秒）
    const refreshInterval = setInterval(() => {
      console.log('⏰ 定时刷新用户列表');
      loadUsers();
    }, 30000);
    
    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('userDataUpdated', handleUserDataUpdated as EventListener);
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
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
    // 确保token存在
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('认证已过期，请重新登录');
      return;
    }
    
    const width = 1200;
    const height = 800;
    const left = Math.floor((screen.width - width) / 2);
    const top = Math.floor((screen.height - height) / 2);
    
    const newWindow = window.open(
      './add-user-window.html',
      'addUser',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no`
    );
    
    // 传递token到新窗口
    if (newWindow) {
      newWindow.addEventListener('load', () => {
        try {
          newWindow.localStorage.setItem('auth_token', token);
          console.log('✅ Token已传递到添加用户窗口');
        } catch (e) {
          console.error('❌ 无法传递token到新窗口:', e);
        }
      });
      
      // 监听窗口关闭事件
      const checkWindowClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkWindowClosed);
          console.log('🔄 添加用户窗口已关闭，刷新列表');
          loadUsers();
        }
      }, 500);
    }
    
    if (!newWindow) {
      const useInline = window.confirm('无法打开新窗口，可能被浏览器阻止了。\n\n点击"确定"使用内联表单添加用户，\n点击"取消"查看解决方案。');
      if (useInline) {
        // 备用方案：使用内联表单
        setFormData({
          username: '',
          password: '',
          name: '',
          full_name: '',
          role: 'user',
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

  // 删除用户
  const handleDelete = async (user: User) => {
    if (!window.confirm(`确定要删除用户 ${user.name || user.username} 吗？`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await userAPI.delete(user.id.toString());
      if (response.success) {
        await loadUsers();
        alert('用户删除成功！');
      } else {
        alert('删除失败: ' + response.error);
      }
    } catch (error: any) {
      alert('删除失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (user: User) => {
    const newPassword = prompt(`重置用户 ${user.name || user.username} 的密码为：`, '123456');
    if (!newPassword) return;
    
    try {
      setLoading(true);
      const response = await userAPI.update(user.id.toString(), {
        password: newPassword,
        name: user.name || '',
        full_name: user.full_name || user.name || '',
        employee_id: user.employee_id || '',
        company: user.company || '兴隆村车站'
      });
      if (response.success) {
        alert(`密码已重置为: ${newPassword}`);
      } else {
        alert('密码重置失败: ' + response.error);
      }
    } catch (error: any) {
      alert('密码重置失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑用户表单或新窗口
  const handleEdit = (user: User) => {
    // 确保token存在
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('认证已过期，请重新登录');
      return;
    }
    
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
    
    // 传递token到新窗口
    if (newWindow) {
      newWindow.addEventListener('load', () => {
        try {
          newWindow.localStorage.setItem('auth_token', token);
          console.log('✅ Token已传递到编辑用户窗口');
        } catch (e) {
          console.error('❌ 无法传递token到新窗口:', e);
        }
      });
      
      // 监听窗口关闭事件
      const checkWindowClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkWindowClosed);
          console.log('🔄 编辑用户窗口已关闭，刷新列表');
          loadUsers();
        }
      }, 500);
    }
    
    if (!newWindow) {
      const useInline = window.confirm('无法打开新窗口，可能被浏览器阻止了。\n\n点击"确定"使用内联表单编辑用户，\n点击"取消"查看解决方案。');
      if (useInline) {
        // 备用方案：使用内联表单
        setFormData({
          username: user.username,
          password: '',
          name: user.name,
          full_name: user.full_name || '',
          role: user.role || 'user',
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
        // 创建用户 - 使用表单中的role
        const userData = { ...formData };
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadUsers}
            disabled={loading}
            style={{
              padding: '8px 14px',
              background: loading ? '#9CA3AF' : '#6B7280',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
            title="刷新用户列表"
          >
            {loading ? '刷新中...' : '🔄 刷新'}
          </button>
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
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>用户名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>姓名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#111827' }}>角色</th>
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
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <strong>{user.username}</strong>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', fontWeight: 600 }}>
                    {user.full_name || user.name}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '11px',
                      fontWeight: 600,
                      background: user.role === 'admin' ? '#fef0f0' : user.role === 'maintenance' ? '#fdf6ec' : '#f0f9ff',
                      color: user.role === 'admin' ? '#f56c6c' : user.role === 'maintenance' ? '#e6a23c' : '#409eff'
                    }}>
                      {user.role === 'admin' ? '管理员' : user.role === 'maintenance' ? '维护人员' : '普通用户'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>白市驿车站</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.team || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{user.job_type || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          padding: '4px 8px',
                          background: '#e6a23c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                        title="编辑用户"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        style={{
                          padding: '4px 8px',
                          background: '#67c23a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                        title="重置密码"
                      >
                        重置密码
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        style={{
                          padding: '4px 8px',
                          background: '#f56c6c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                        title="删除用户"
                      >
                        删除
                      </button>
                    </div>
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
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#111827', fontWeight: 600 }}>角色权限</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'maintenance' | 'user'})}
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
                  <option value="user">普通用户</option>
                  <option value="maintenance">维护人员</option>
                  <option value="admin">管理员</option>
                </select>
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