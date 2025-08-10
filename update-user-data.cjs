const { pool } = require('./server/config/database');

async function updateUserData() {
  try {
    console.log('更新用户姓名和电话号码...');
    
    // 更新现有用户的姓名和电话
    const updates = [
      { username: 'maintenance', name: '王强', phone: '13800138001' },
      { username: 'admin', name: '陈明', phone: '13800138002' },
      { username: 'user', name: '张三', phone: '13812345678' }
    ];
    
    for (const update of updates) {
      await pool.execute(
        'UPDATE users SET name = ?, full_name = ?, phone = ? WHERE username = ?',
        [update.name, update.name, update.phone, update.username]
      );
      console.log(`✓ 更新用户: ${update.username} -> ${update.name} (${update.phone})`);
    }
    
    // 如果需要，添加更多测试用户
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count < 6) {
      console.log('添加更多测试用户...');
      
      const newUsers = [
        { username: 'lisi', password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', name: '李四', phone: '13987654321', employee_id: '10002', team: '运转二班', job_type: '助理值班员（内勤）' },
        { username: 'wangwu', password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', name: '王五', phone: '13611122233', employee_id: '10003', team: '运转三班', job_type: '助理值班员（外勤）' },
        { username: 'zhaoliu', password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', name: '赵六', phone: '13755566678', employee_id: '10004', team: '运转四班', job_type: '连结员' }
      ];
      
      for (const user of newUsers) {
        try {
          await pool.execute(
            'INSERT INTO users (username, password, name, full_name, role, employee_id, company, department, team, job_type, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user.username, user.password, user.name, user.name, 'user', user.employee_id, '兴隆村车站', '白市驿车站', user.team, user.job_type, user.phone, `${user.username}@example.com`]
          );
          console.log(`✓ 添加用户: ${user.name} (${user.username})`);
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`- 用户已存在: ${user.username}`);
          } else {
            console.error(`添加用户失败: ${user.username}`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ 用户数据更新完成!');
    
    // 显示最终用户列表
    const [users] = await pool.execute('SELECT id, username, name, full_name, employee_id, phone, team, job_type FROM users ORDER BY id');
    console.log('\n📋 当前用户列表:');
    users.forEach(user => {
      console.log(`${user.employee_id || 'N/A'} | ${user.name} (@${user.username}) | ${user.phone || '无电话'} | ${user.team || '无班组'} | ${user.job_type || '无工种'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

updateUserData();