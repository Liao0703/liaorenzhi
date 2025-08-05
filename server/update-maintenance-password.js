const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const updatePassword = async () => {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'learning_platform'
    });

    // 生成新密码的哈希值
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('新密码:', newPassword);
    console.log('密码哈希:', hashedPassword);

    // 更新数据库
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'maintenance']
    );

    console.log('更新结果:', result);
    console.log('✅ maintenance用户密码已更新为: 123456');

    await connection.end();
  } catch (error) {
    console.error('❌ 更新密码失败:', error);
  }
};

updatePassword(); 