/**
 * 修复用户管理窗口认证问题
 * 确保编辑和添加用户窗口能正确获取和使用认证token
 */

// 修复编辑用户窗口
function fixEditUserWindow() {
  const editWindowScript = `
    // 从URL参数获取用户信息
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    
    // 从父窗口获取token（如果存在）
    let authToken = localStorage.getItem('auth_token');
    
    // 如果没有token，尝试从父窗口获取
    if (!authToken && window.opener) {
      try {
        authToken = window.opener.localStorage.getItem('auth_token');
        if (authToken) {
          localStorage.setItem('auth_token', authToken);
          console.log('✅ 从父窗口获取到token');
        }
      } catch (e) {
        console.warn('⚠️ 无法从父窗口获取token:', e);
      }
    }
    
    // 检查token是否存在
    if (!authToken) {
      alert('认证失败，请重新登录');
      window.close();
    } else {
      console.log('🔑 Token已就绪');
    }
  `;
  
  console.log('修复脚本已生成，请在编辑窗口中执行');
  return editWindowScript;
}

// 修复添加用户窗口
function fixAddUserWindow() {
  const addWindowScript = `
    // 从父窗口获取token
    let authToken = localStorage.getItem('auth_token');
    
    // 如果没有token，尝试从父窗口获取
    if (!authToken && window.opener) {
      try {
        authToken = window.opener.localStorage.getItem('auth_token');
        if (authToken) {
          localStorage.setItem('auth_token', authToken);
          console.log('✅ 从父窗口获取到token');
        }
      } catch (e) {
        console.warn('⚠️ 无法从父窗口获取token:', e);
      }
    }
    
    // 检查token是否存在
    if (!authToken) {
      alert('认证失败，请重新登录');
      window.close();
    } else {
      console.log('🔑 Token已就绪');
    }
  `;
  
  console.log('修复脚本已生成，请在添加窗口中执行');
  return addWindowScript;
}

// 主函数 - 修复用户管理组件中的窗口打开逻辑
function fixUserManagementComponent() {
  console.log(`
  📝 请在 src/components/UserManagement.tsx 中更新窗口打开逻辑：
  
  1. 编辑用户时：
  const handleEdit = (user) => {
    // 确保token存在
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    // 打开编辑窗口
    const editWindow = window.open(
      \`/edit-user-window.html?id=\${user.id}&username=\${user.username}&name=\${user.name || ''}&full_name=\${user.full_name || ''}&employee_id=\${user.employee_id || ''}&department=\${user.department || ''}&team=\${user.team || ''}&job_type=\${user.job_type || ''}&role=\${user.role || 'user'}&email=\${user.email || ''}&phone=\${user.phone || ''}\`,
      '_blank',
      'width=600,height=700'
    );
    
    // 传递token到新窗口
    editWindow.onload = () => {
      editWindow.localStorage.setItem('auth_token', token);
    };
  };
  
  2. 添加用户时：
  const handleAdd = () => {
    // 确保token存在
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    // 打开添加窗口
    const addWindow = window.open(
      '/add-user-window.html',
      '_blank',
      'width=600,height=700'
    );
    
    // 传递token到新窗口
    addWindow.onload = () => {
      addWindow.localStorage.setItem('auth_token', token);
    };
  };
  `);
}

// 测试token传递
function testTokenPassing() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    console.log('✅ 主窗口token存在:', token.substring(0, 20) + '...');
    
    // 测试API调用
    fetch('http://localhost:3002/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('📡 API响应状态:', response.status);
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('✅ API调用成功，返回', data.data?.length || 0, '个用户');
      } else {
        console.error('❌ API调用失败:', data.error);
      }
    })
    .catch(error => {
      console.error('❌ 网络错误:', error);
    });
  } else {
    console.error('❌ 未找到token，请先登录');
  }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fixEditUserWindow,
    fixAddUserWindow,
    fixUserManagementComponent,
    testTokenPassing
  };
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  window.fixUserAuth = {
    fixEditUserWindow,
    fixAddUserWindow,
    testTokenPassing
  };
  
  console.log('🔧 用户窗口认证修复工具已加载');
  console.log('使用方法：');
  console.log('1. window.fixUserAuth.testTokenPassing() - 测试token');
  console.log('2. window.fixUserAuth.fixEditUserWindow() - 获取编辑窗口修复代码');
  console.log('3. window.fixUserAuth.fixAddUserWindow() - 获取添加窗口修复代码');
}
