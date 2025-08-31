import React, { useState, useEffect } from 'react';
import { userAPI } from './config/api';

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

interface MaintenanceAdminRealDBProps {
  user: any;
  onLogout: () => void;
}

const MaintenanceAdminRealDB: React.FC<MaintenanceAdminRealDBProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'maintenance'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [userFormData, setUserFormData] = useState({
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

  // 选项数据
  const departments = ['团结村车站','白市驿车站','陶家场线路所','铜罐驿车站','石场车站','中梁山','跳蹬车站','珞璜车站','小南海车站','伏牛溪车站','茄子溪车站','大渡口车站','重庆南车站'];
  const teams = ['运转一班', '运转二班', '运转三班', '运转四班'];
  const jobTypes = ['车站值班员', '助理值班员（内勤）', '助理值班员（外勤）', '连结员', '调车长', '列尾作业员', '站调', '车号员', '司机', '调度员', '信号工', '检车员', '系统管理员'];
  const companies = ['兴隆村车站', '铁路局', '机务段', '车务段', '工务段', '电务段'];

  // 权限检查
  if (!user || (user.role !== 'maintenance' && user.role !== 'admin')) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <h2>⚠️ 权限不足</h2>
          <p>您需要维护人员或管理员权限才能访问此页面</p>
          <button onClick={onLogout} style={{
            padding: '10px 20px',
            background: '#ff4757',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px'
          }}>
            返回登录
          </button>
        </div>
      </div>
    );
  }

  // 加载真实用户数据
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAll();
      if (response.success && response.data) {
        setUsers(response.data);
        showMessage('success', `成功加载 ${response.data.length} 个用户`);
      } else {
        throw new Error(response.error || '加载失败');
      }
    } catch (error) {
      console.error('加载用户失败:', error);
      showMessage('error', '加载用户失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 生成工号
  const generateEmployeeId = () => {
    const existing = users.map(u => u.employee_id).filter(Boolean);
    let newId = 10001;
    while (existing.includes(newId.toString().padStart(5, '0'))) {
      newId++;
    }
    return newId.toString().padStart(5, '0');
  };

  // 添加用户
  const handleAddUser = () => {
    setUserFormData({
      username: '',
      password: '',
      name: '',
      full_name: '',
      role: 'user',
      employee_id: generateEmployeeId(),
      department: departments[0],
      team: teams[0],
      job_type: jobTypes[0],
      company: companies[0],
      email: '',
      phone: ''
    });
    setEditingUser(null);
    setShowUserForm(true);
  };

  // 编辑用户
  const handleEditUser = (user: User) => {
    setUserFormData({
      username: user.username,
      password: '', // 编辑时不显示密码
      name: user.name,
      full_name: user.full_name || user.name,
      role: user.role,
      employee_id: user.employee_id || '',
      department: user.department || departments[0],
      team: user.team || '',
      job_type: user.job_type || '',
      company: user.company || companies[0],
      email: user.email || '',
      phone: user.phone || ''
    });
    setEditingUser(user);
    setShowUserForm(true);
  };

  // 保存用户（创建或更新）
  const handleSaveUser = async () => {
    try {
      setLoading(true);
      
      if (editingUser) {
        // 更新用户
        const updateData = { ...userFormData };
        if (!updateData.password) {
          delete (updateData as any).password; // 如果密码为空，不更新密码
        }
        
        const response = await userAPI.update(editingUser.id.toString(), updateData);
        if (response.success) {
          showMessage('success', '用户更新成功');
          setShowUserForm(false);
          loadUsers();
        } else {
          throw new Error(response.error || '更新失败');
        }
      } else {
        // 创建新用户
        if (!userFormData.password) {
          showMessage('error', '请输入密码');
          return;
        }
        
        const response = await userAPI.create(userFormData);
        if (response.success) {
          showMessage('success', '用户创建成功');
          setShowUserForm(false);
          loadUsers();
        } else {
          throw new Error(response.error || '创建失败');
        }
      }
    } catch (error) {
      console.error('保存用户失败:', error);
      showMessage('error', error instanceof Error ? error.message : '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`确定要删除用户 ${user.username}（${user.name}）吗？此操作不可恢复！`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await userAPI.delete(user.id.toString());
      if (response.success) {
        showMessage('success', '用户已删除');
        loadUsers();
      } else {
        throw new Error(response.error || '删除失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      showMessage('error', error instanceof Error ? error.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (user: User) => {
    const newPassword = window.prompt(`重置用户 ${user.username} 的密码为：`, '123456');
    if (!newPassword) return;
    
    try {
      setLoading(true);
      const updateData = {
        ...user,
        password: newPassword,
        full_name: user.full_name || user.name
      };
      
      const response = await userAPI.update(user.id.toString(), updateData);
      if (response.success) {
        showMessage('success', `密码已重置为: ${newPassword}`);
      } else {
        throw new Error(response.error || '重置失败');
      }
    } catch (error) {
      console.error('重置密码失败:', error);
      showMessage('error', error instanceof Error ? error.message : '重置密码失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      user.username.toLowerCase().includes(keyword) ||
      user.name.toLowerCase().includes(keyword) ||
      (user.employee_id && user.employee_id.toLowerCase().includes(keyword)) ||
      (user.department && user.department.toLowerCase().includes(keyword))
    );
  });

  // 统计信息
  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    maintenance: users.filter(u => u.role === 'maintenance').length,
    user: users.filter(u => u.role === 'user').length
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* 头部 */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>🔧 维护人员管理后台 - 真实数据库</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>
            当前用户：{user.name || user.username} ({user.role === 'admin' ? '管理员' : '维护人员'})
          </p>
        </div>
        <button onClick={onLogout} style={{
          padding: '10px 20px',
          background: '#ff4757',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          退出登录
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{
          padding: '12px 20px',
          background: message.type === 'success' ? '#67c23a' : '#f56c6c',
          color: '#fff',
          borderRadius: '8px',
          marginBottom: '20px',
          animation: 'slideDown 0.3s ease'
        }}>
          {message.text}
        </div>
      )}

      {/* 选项卡 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 30px',
            background: activeTab === 'users' ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          👥 用户管理
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            padding: '12px 30px',
            background: activeTab === 'maintenance' ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🛠️ 系统维护
        </button>
      </div>

      {/* 用户管理内容 */}
      {activeTab === 'users' && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '30px',
          borderRadius: '12px'
        }}>
          {/* 统计卡片 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #409eff' }}>
              <h3 style={{ margin: 0, color: '#909399', fontSize: '14px' }}>总用户数</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#303133', marginTop: '10px' }}>{stats.total}</div>
            </div>
            <div style={{ background: '#fef0f0', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f56c6c' }}>
              <h3 style={{ margin: 0, color: '#909399', fontSize: '14px' }}>管理员</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#303133', marginTop: '10px' }}>{stats.admin}</div>
            </div>
            <div style={{ background: '#fdf6ec', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e6a23c' }}>
              <h3 style={{ margin: 0, color: '#909399', fontSize: '14px' }}>维护人员</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#303133', marginTop: '10px' }}>{stats.maintenance}</div>
            </div>
            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #67c23a' }}>
              <h3 style={{ margin: 0, color: '#909399', fontSize: '14px' }}>普通用户</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#303133', marginTop: '10px' }}>{stats.user}</div>
            </div>
          </div>

          {/* 工具栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="搜索用户名、姓名、工号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #dcdfe6',
                  borderRadius: '4px',
                  width: '300px'
                }}
              />
              <button onClick={loadUsers} style={{
                padding: '8px 18px',
                background: '#67c23a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                🔄 刷新
              </button>
            </div>
            <button onClick={handleAddUser} style={{
              padding: '8px 18px',
              background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              ➕ 添加用户
            </button>
          </div>

          {/* 用户列表 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#909399' }}>
              加载中...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f7fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>用户名</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>姓名</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>角色</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>工号</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>部门</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>班组</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>工种</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e4e7ed' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{user.id}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{user.username}</td>
                      <td style={{ padding: '12px' }}>{user.name}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: user.role === 'admin' ? '#fef0f0' : user.role === 'maintenance' ? '#fdf6ec' : '#f0f9ff',
                          color: user.role === 'admin' ? '#f56c6c' : user.role === 'maintenance' ? '#e6a23c' : '#409eff'
                        }}>
                          {user.role === 'admin' ? '管理员' : user.role === 'maintenance' ? '维护人员' : '普通用户'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{user.employee_id || '-'}</td>
                      <td style={{ padding: '12px' }}>{user.department || '-'}</td>
                      <td style={{ padding: '12px' }}>{user.team || '-'}</td>
                      <td style={{ padding: '12px' }}>{user.job_type || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditUser(user)} style={{
                            padding: '6px 12px',
                            background: '#e6a23c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>编辑</button>
                          <button onClick={() => handleResetPassword(user)} style={{
                            padding: '6px 12px',
                            background: '#67c23a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>重置密码</button>
                          <button onClick={() => handleDeleteUser(user)} style={{
                            padding: '6px 12px',
                            background: '#f56c6c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 系统维护内容 */}
      {activeTab === 'maintenance' && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '30px',
          borderRadius: '12px'
        }}>
          <h3>系统维护功能</h3>
          <p style={{ color: '#909399' }}>系统维护功能正在开发中...</p>
        </div>
      )}

      {/* 用户表单模态框 */}
      {showUserForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '30px',
            width: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2>{editingUser ? '编辑用户' : '添加用户'}</h2>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>用户名 *</div>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  disabled={!!editingUser}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                />
              </label>
              
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>
                  密码 {editingUser ? '(留空则不修改)' : '*'}
                </div>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                />
              </label>
              
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>姓名 *</div>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                />
              </label>
              
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>角色 *</div>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                >
                  <option value="user">普通用户</option>
                  <option value="maintenance">维护人员</option>
                  <option value="admin">管理员</option>
                </select>
              </label>
              
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>工号</div>
                <input
                  type="text"
                  value={userFormData.employee_id}
                  onChange={(e) => setUserFormData({ ...userFormData, employee_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                />
              </label>
              
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>部门</div>
                <select
                  value={userFormData.department}
                  onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </label>
              
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>班组</div>
                <select
                  value={userFormData.team}
                  onChange={(e) => setUserFormData({ ...userFormData, team: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">请选择</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </label>
              
              <label style={{ display: 'block', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', color: '#606266' }}>工种</div>
                <select
                  value={userFormData.job_type}
                  onChange={(e) => setUserFormData({ ...userFormData, job_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">请选择</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e4e7ed'
            }}>
              <button onClick={() => setShowUserForm(false)} style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#606266',
                border: '1px solid #dcdfe6',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                取消
              </button>
              <button onClick={handleSaveUser} disabled={loading} style={{
                padding: '10px 20px',
                background: '#409eff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}>
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceAdminRealDB;
