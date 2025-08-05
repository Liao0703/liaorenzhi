import React from 'react';
import MaintenanceAdminPanel from './MaintenanceAdminPanel';

// 测试用的模拟用户数据
const mockMaintenanceUser = {
  id: 2,
  username: 'maintenance',
  name: '维护人员',
  role: 'maintenance',
  employee_id: '10002',
  department: '机务段',
  team: '维护班',
  job_type: '系统管理员'
};

const mockAdminUser = {
  id: 1,
  username: 'admin',
  name: '系统管理员',
  role: 'admin',
  employee_id: '10001',
  department: 'IT部门',
  team: 'IT团队',
  job_type: '系统管理员'
};

const mockLogout = () => {
  console.log('模拟退出登录');
  alert('退出登录功能正常');
};

const MaintenanceAdminTest: React.FC = () => {
  const [currentUser, setCurrentUser] = React.useState(mockMaintenanceUser);

  return (
    <div>
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        <div>测试控制面板</div>
        <button
          onClick={() => setCurrentUser(mockMaintenanceUser)}
          style={{
            margin: '5px 2px',
            padding: '5px 10px',
            background: currentUser.role === 'maintenance' ? '#67c23a' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          维护人员
        </button>
        <button
          onClick={() => setCurrentUser(mockAdminUser)}
          style={{
            margin: '5px 2px',
            padding: '5px 10px',
            background: currentUser.role === 'admin' ? '#409eff' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          管理员
        </button>
      </div>
      
      <MaintenanceAdminPanel 
        user={currentUser} 
        onLogout={mockLogout} 
      />
    </div>
  );
};

export default MaintenanceAdminTest; 