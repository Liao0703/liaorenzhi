import React, { useState, useEffect } from 'react';

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

interface MaintenanceConfig {
  isEnabled: boolean;
  message: string;
  startTime: string;
  endTime?: string;
  reason: string;
  enabledBy: string;
}

interface MaintenanceAdminSimpleProps {
  user: any;
  onLogout: () => void;
}

const MaintenanceAdminSimple: React.FC<MaintenanceAdminSimpleProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'maintenance'>('users');
  
  // 用户管理状态
  const [users, setUsers] = useState<User[]>([]);
  // const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  // const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
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

  // 维护管理状态
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceConfig | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceConfig[]>([]);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    reason: '',
    message: ''
  });

  // 选项数据
  const departments = ['机务段', '车务段', '工务段', '电务段', '车辆段', '供电段', 'IT部门', '管理部门', '安全部门'];
  const jobTypes = ['司机', '调度员', '信号工', '检车员', '线路工', '电气化工', '系统管理员', '安全员', '管理员'];
  const companies = ['铁路局', '机务段', '车务段', '工务段', '电务段', '车辆段', '供电段'];

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
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              background: '#ff4757',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  // 初始化数据
  useEffect(() => {
    loadMockUsers();
    loadMaintenanceData();
  }, []);

  // 模拟用户数据加载
  const loadMockUsers = () => {
    setUsers([
      {
        id: 1,
        username: 'admin',
        name: '系统管理员',
        role: 'admin',
        employee_id: '10001',
        department: 'IT部门',
        team: '系统组',
        job_type: '系统管理员',
        company: '铁路局'
      },
      {
        id: 2,
        username: 'maintenance',
        name: '维护人员',
        role: 'maintenance',
        employee_id: '10002',
        department: '机务段',
        team: '维护班',
        job_type: '系统管理员',
        company: '机务段'
      },
      {
        id: 3,
        username: 'user1',
        name: '张三',
        role: 'user',
        employee_id: '10003',
        department: '车务段',
        team: '运转一班',
        job_type: '车站值班员',
        company: '车务段'
      }
    ]);
  };

  // 维护数据加载
  const loadMaintenanceData = () => {
    try {
      const config = localStorage.getItem('learning_maintenance_config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        setIsMaintenanceMode(parsedConfig.isEnabled);
        setMaintenanceInfo(parsedConfig);
      }
      
      const history = localStorage.getItem('learning_maintenance_history');
      if (history) {
        setMaintenanceHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('加载维护数据失败:', error);
    }
  };

  // 用户管理函数
  const generateEmployeeId = () => {
    const existing = users.map(u => u.employee_id).filter(Boolean);
    let newId = 10001;
    while (existing.includes(newId.toString().padStart(5, '0'))) {
      newId++;
    }
    return newId.toString().padStart(5, '0');
  };

  const handleAddUser = () => {
    setUserFormData({
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
    // setEditingUser(null);
    setShowUserForm(true);
  };

  const handleSaveUser = () => {
    alert('用户保存功能需要连接后端API。当前为演示模式。');
    setShowUserForm(false);
  };

  // 维护管理函数
  const handleEnableMaintenance = () => {
    if (!maintenanceFormData.reason.trim() || !maintenanceFormData.message.trim()) {
      alert('请填写完整的维护信息');
      return;
    }

    const config: MaintenanceConfig = {
      isEnabled: true,
      reason: maintenanceFormData.reason.trim(),
      message: maintenanceFormData.message.trim(),
      enabledBy: user.name || user.username,
      startTime: new Date().toISOString()
    };

    localStorage.setItem('learning_maintenance_config', JSON.stringify(config));
    
    // 保存历史记录
    const history = [...maintenanceHistory, config];
    if (history.length > 10) {
      history.shift();
    }
    localStorage.setItem('learning_maintenance_history', JSON.stringify(history));

    setMaintenanceFormData({ reason: '', message: '' });
    setShowMaintenanceForm(false);
    loadMaintenanceData();
    alert('维护模式已启用');
  };

  const handleDisableMaintenance = () => {
    if (window.confirm('确定要禁用维护模式吗？')) {
      if (maintenanceInfo) {
        const updatedConfig = {
          ...maintenanceInfo,
          isEnabled: false,
          endTime: new Date().toISOString()
        };
        localStorage.setItem('learning_maintenance_config', JSON.stringify(updatedConfig));
        
        // 更新历史记录
        const history = [...maintenanceHistory];
        if (history.length > 0) {
          history[history.length - 1] = updatedConfig;
          localStorage.setItem('learning_maintenance_history', JSON.stringify(history));
        }
      }
      loadMaintenanceData();
      alert('维护模式已禁用');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}小时${minutes}分钟`;
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '15px 25px',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            🔧 维护人员管理后台
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            欢迎，{user.name || user.username} ({user.role === 'admin' ? '系统管理员' : '维护人员'})
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 71, 87, 0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🚪 退出登录
        </button>
      </div>

      {/* 功能选项卡 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        backdropFilter: 'blur(10px)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
          paddingBottom: '15px'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'users' 
                ? 'linear-gradient(90deg, #409eff 60%, #2b8cff 100%)' 
                : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            👥 用户管理
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'maintenance' 
                ? 'linear-gradient(90deg, #409eff 60%, #2b8cff 100%)' 
                : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            🛠️ 系统维护
          </button>
        </div>
      </div>

      {/* 用户管理内容 */}
      {activeTab === 'users' && (
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
              onClick={handleAddUser}
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
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
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '8px', fontSize: '12px' }}>
                      <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {user.employee_id || '-'}
                      </code>
                    </td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>{user.username}</td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>{user.name}</td>
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
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => alert('编辑功能需要后端API支持')}
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
                ))}
              </tbody>
            </table>
          </div>

          {/* 用户表单 */}
          {showUserForm && (
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
              zIndex: 1000
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px',
                borderRadius: '15px',
                width: '90%',
                maxWidth: '500px',
                color: '#fff'
              }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>添加用户</h4>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>用户名</label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={e => setUserFormData({...userFormData, username: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                    placeholder="用户名"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => setShowUserForm(false)}
                    style={{
                      padding: '8px 20px',
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveUser}
                    style={{
                      padding: '8px 20px',
                      background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 系统维护内容 */}
      {activeTab === 'maintenance' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          color: '#333'
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
            🛠️ 系统维护管理
          </h3>

          {/* 当前状态 */}
          <div style={{
            background: isMaintenanceMode ? '#fff3cd' : '#d4edda',
            border: `1px solid ${isMaintenanceMode ? '#ffeaa7' : '#c3e6cb'}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ color: isMaintenanceMode ? '#856404' : '#155724' }}>
                  {isMaintenanceMode ? '🛠️ 系统维护中' : '✅ 系统正常运行'}
                </strong>
                {maintenanceInfo && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    维护原因: {maintenanceInfo.reason}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginBottom: '24px' }}>
            {!isMaintenanceMode ? (
              <button
                onClick={() => setShowMaintenanceForm(true)}
                style={{
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🛠️ 启用维护模式
              </button>
            ) : (
              <button
                onClick={handleDisableMaintenance}
                style={{
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✅ 禁用维护模式
              </button>
            )}
          </div>

          {/* 启用维护模式表单 */}
          {showMaintenanceForm && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#333' }}>启用维护模式</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  维护原因 *
                </label>
                <input
                  type="text"
                  value={maintenanceFormData.reason}
                  onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, reason: e.target.value })}
                  placeholder="请输入维护原因"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  维护信息 *
                </label>
                <textarea
                  value={maintenanceFormData.message}
                  onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, message: e.target.value })}
                  placeholder="请输入详细的维护信息"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleEnableMaintenance}
                  style={{
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  确认启用
                </button>
                <button
                  onClick={() => setShowMaintenanceForm(false)}
                  style={{
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 维护历史 */}
          <div>
            <h3 style={{
              color: '#333',
              marginBottom: '16px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              📋 维护历史记录
            </h3>
            
            {maintenanceHistory.length === 0 ? (
              <div style={{ color: '#666', fontStyle: 'italic' }}>
                暂无维护历史记录
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {maintenanceHistory.slice().reverse().map((record, index) => (
                  <div
                    key={index}
                    style={{
                      background: record.isEnabled ? '#fff3cd' : '#d4edda',
                      border: `1px solid ${record.isEnabled ? '#ffeaa7' : '#c3e6cb'}`,
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: 'bold', color: record.isEnabled ? '#856404' : '#155724' }}>
                        {record.isEnabled ? '🛠️ 维护中' : '✅ 已完成'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {formatDate(record.startTime)}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '6px' }}>
                      <strong>原因:</strong> {record.reason}
                    </div>
                    
                    <div style={{ marginBottom: '6px' }}>
                      <strong>信息:</strong> {record.message}
                    </div>
                    
                    <div style={{ marginBottom: '6px' }}>
                      <strong>维护人员:</strong> {record.enabledBy}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <strong>持续时间:</strong> {getDuration(record.startTime, record.endTime)}
                      {record.endTime && (
                        <span style={{ marginLeft: '10px' }}>
                          <strong>结束时间:</strong> {formatDate(record.endTime)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '12px'
      }}>
        <p>班前学习监督系统 - 维护人员管理后台 v1.0.0</p>
        <p>如有问题请联系系统管理员</p>
      </div>
    </div>
  );
};

export default MaintenanceAdminSimple; 