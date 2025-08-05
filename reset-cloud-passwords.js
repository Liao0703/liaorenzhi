const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetCloudPasswords() {
  // 云服务器数据库连接配置
  const connection = await mysql.createConnection({
    host: 'localhost', // 云服务器本地数据库
    user: 'root',
    password: '123456', // 根据实际情况调整
    database: 'learning_platform'
  });

  try {
    console.log('🔄 开始重置云服务器用户密码...');
    
    // 统一使用 123456 作为所有账号的密码
    const password123456 = await bcrypt.hash('123456', 10);

    // 更新所有用户的密码为 123456
    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [password123456, 'admin']
    );

    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [password123456, 'maintenance']
    );

    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [password123456, 'user']
    );

    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [password123456, 'testadmin']
    );

    console.log('✅ 云服务器密码重置成功！');
    console.log('📋 所有用户账号密码已统一为：');
    console.log('👨‍💼 管理员: admin / 123456');
    console.log('🔧 维护人员: maintenance / 123456');
    console.log('👤 普通用户: user / 123456');
    console.log('👑 测试管理员: testadmin / 123456');

    // 验证更新后的密码
    console.log('\n🔍 验证密码更新：');
    const [users] = await connection.execute(
      'SELECT username, password FROM users ORDER BY id'
    );

    for (const user of users) {
      const isValid = await bcrypt.compare('123456', user.password);
      console.log(`${user.username}: ${isValid ? '✅ 正确' : '❌ 错误'}`);
    }

  } catch (error) {
    console.error('❌ 密码重置失败:', error);
    console.log('\n💡 可能的解决方案：');
    console.log('1. 检查数据库连接配置');
    console.log('2. 确认数据库用户权限');
    console.log('3. 检查 users 表是否存在');
  } finally {
    await connection.end();
    console.log('\n🔚 数据库连接已关闭');
  }
}

// 运行脚本
resetCloudPasswords().catch(console.error);