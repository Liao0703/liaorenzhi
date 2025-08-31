const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('测试MySQL连接...\n');
  
  // 测试不同的配置
  const configs = [
    { host: 'localhost', user: 'root', password: '', database: 'learning_platform', name: '无密码' },
    { host: 'localhost', user: 'root', password: 'root', database: 'learning_platform', name: '密码: root' },
    { host: 'localhost', user: 'root', password: '123456', database: 'learning_platform', name: '密码: 123456' },
    { host: '127.0.0.1', user: 'root', password: '', database: 'learning_platform', name: '127.0.0.1 无密码' },
  ];
  
  for (const config of configs) {
    console.log(`尝试配置: ${config.name}`);
    try {
      const connection = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database
      });
      
      console.log(`✅ 连接成功！使用配置: ${config.name}`);
      
      // 检查users表
      const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
      if (tables.length > 0) {
        console.log('✅ users表存在');
        
        // 查询用户数量
        const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`📊 users表中有 ${countResult[0].count} 个用户`);
        
        // 查询最近的用户
        const [users] = await connection.execute('SELECT id, username, name, role FROM users ORDER BY id DESC LIMIT 5');
        if (users.length > 0) {
          console.log('最近的用户:');
          users.forEach(user => {
            console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}`);
          });
        }
      } else {
        console.log('❌ users表不存在');
      }
      
      await connection.end();
      console.log('\n正确的数据库配置:');
      console.log(`  host: '${config.host}'`);
      console.log(`  user: '${config.user}'`);
      console.log(`  password: '${config.password}'`);
      console.log(`  database: '${config.database}'`);
      
      return true;
    } catch (error) {
      console.log(`❌ 连接失败: ${error.message}\n`);
    }
  }
  
  console.log('\n所有配置都失败了。请检查:');
  console.log('1. MySQL服务是否运行: brew services list | grep mysql');
  console.log('2. 数据库是否存在: mysql -u root -p -e "SHOW DATABASES;"');
  console.log('3. 用户权限是否正确');
  
  return false;
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

