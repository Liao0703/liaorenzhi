const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updatePassword() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'learning_platform'
  });

  try {
    // 生成新密码的哈希值
    const adminPassword = await bcrypt.hash('admin123', 10);
    const maintenancePassword = await bcrypt.hash('123456', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    console.log('Generated hashes:');
    console.log('admin123:', adminPassword);
    console.log('123456:', maintenancePassword);
    console.log('user123:', userPassword);

    // 更新用户密码
    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [adminPassword, 'admin']
    );

    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [maintenancePassword, 'maintenance']
    );

    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [userPassword, 'user']
    );

    console.log('✅ 密码更新成功！');

    // 验证密码
    const [users] = await connection.execute(
      'SELECT username, password FROM users'
    );

    console.log('验证密码:');
    for (const user of users) {
      const isValid = await bcrypt.compare('admin123', user.password);
      console.log(`${user.username}: ${isValid ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ 密码更新失败:', error);
  } finally {
    await connection.end();
  }
}

updatePassword(); 