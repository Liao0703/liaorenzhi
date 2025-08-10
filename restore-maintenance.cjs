const { pool } = require('./server/config/database');

async function restoreMaintenance() {
  try {
    console.log('恢复维护人员账户...');
    
    // 恢复maintenance为维护人员角色，保持孙七的名字
    await pool.execute(
      'UPDATE users SET role = ? WHERE username = ?',
      ['maintenance', 'maintenance']
    );
    
    console.log('✓ 恢复maintenance账户为维护人员角色');
    
    // 显示更新后的用户列表
    const [users] = await pool.execute('SELECT username, name, employee_id, role, phone, team, job_type FROM users ORDER BY employee_id');
    console.log('\n📋 当前用户列表:');
    users.forEach(user => {
      const roleText = user.role === 'maintenance' ? '维护人员' : '普通用户';
      console.log(`${user.employee_id} | ${user.name} | ${roleText} | ${user.phone || '无电话'} | ${user.team || '无班组'} | ${user.job_type || '无工种'}`);
    });
    
    console.log('\n✅ 维护人员账户恢复完成!');
    console.log('📝 登录信息:');
    console.log('   维护人员: maintenance / 123456 (孙七)');
    console.log('   其他都是普通用户');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

restoreMaintenance();