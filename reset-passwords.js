const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetPasswords() {
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

    console.log('✅ 密码重置成功！');
    console.log('📋 用户账号和密码：');
    console.log('👨‍💼 管理员: admin / admin123');
    console.log('🔧 维护人员: maintenance / 123456');
    console.log('👤 普通用户: user / user123');

  } catch (error) {
    console.error('❌ 密码重置失败:', error);
  } finally {
    await connection.end();
  }
}

resetPasswords(); 