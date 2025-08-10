const { pool } = require('./server/config/database');

async function normalizeUsers() {
  try {
    console.log('统一用户信息...');
    
    // 将所有用户设置为普通用户，工号统一为数字格式
    const userUpdates = [
      { username: 'maintenance', name: '孙七', employee_id: '10001', role: 'user' },
      { username: 'admin', name: '赵六', employee_id: '10002', role: 'user' },
      { username: 'user', name: '张三', employee_id: '10003', role: 'user' },
      { username: 'lisi', name: '李四', employee_id: '10004', role: 'user' },
      { username: 'wangwu', name: '王五', employee_id: '10005', role: 'user' },
      { username: 'zhaoliu', name: '周八', employee_id: '10006', role: 'user' }
    ];
    
    for (const update of userUpdates) {
      await pool.execute(
        'UPDATE users SET name = ?, full_name = ?, employee_id = ?, role = ? WHERE username = ?',
        [update.name, update.name, update.employee_id, update.role, update.username]
      );
      console.log(`✓ 更新用户: ${update.username} -> ${update.name} (${update.employee_id}) [${update.role}]`);
    }
    
    console.log('\n✅ 用户信息统一完成!');
    
    // 显示更新后的用户列表
    const [users] = await pool.execute('SELECT username, name, employee_id, role, phone, team, job_type FROM users ORDER BY employee_id');
    console.log('\n📋 统一后的用户列表:');
    users.forEach(user => {
      console.log(`${user.employee_id} | ${user.name} | ${user.role} | ${user.phone || '无电话'} | ${user.team || '无班组'} | ${user.job_type || '无工种'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

normalizeUsers();