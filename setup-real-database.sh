#!/bin/bash

# 设置真实数据库连接脚本
# 用于确保维护人员管理页面连接到真实的阿里云RDS数据库

echo "======================================"
echo "配置真实数据库连接"
echo "======================================"
echo ""

# 1. 创建本地.env文件（用于开发环境）
echo "[1] 创建本地环境配置文件..."
cat > server/.env << 'EOF'
# 开发环境配置 - 连接阿里云RDS
NODE_ENV=development
PORT=3002

# 阿里云RDS MySQL数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-learning-platform-2025

# CORS配置
CORS_ORIGIN=http://47.109.142.72,http://localhost:5173,http://127.0.0.1:5173

# 应用配置
APP_NAME=兴隆场车站班前学习监督系统
APP_VERSION=2.0.0
EOF

echo "✅ 本地.env文件已创建"

# 2. 测试数据库连接
echo ""
echo "[2] 测试数据库连接..."
cat > test-real-db.js << 'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function testConnection() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4'
  };
  
  console.log('连接配置:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功！');
    
    // 查询用户数量
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`📊 当前用户数量: ${users[0].count}`);
    
    // 查询最近的5个用户
    const [recentUsers] = await connection.execute(
      'SELECT id, username, name, role, created_at FROM users ORDER BY id DESC LIMIT 5'
    );
    console.log('\n最近注册的用户:');
    recentUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.name}) - ${user.role}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('请检查：');
    console.error('1. 网络连接是否正常');
    console.error('2. 数据库配置是否正确');
    console.error('3. 服务器IP是否在白名单中');
  }
}

testConnection();
EOF

echo "运行测试..."
cd server && node ../test-real-db.js
cd ..

# 3. 修改数据库配置文件，强制使用真实数据库
echo ""
echo "[3] 更新数据库配置..."
cat > server/config/database-real.js << 'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config();

// 强制使用真实数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'admin123',
  password: process.env.DB_PASSWORD || 'Liao0820',
  database: process.env.DB_NAME || 'learning_platform',
  charset: 'utf8mb4',
  timezone: '+08:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('✅ 数据库连接池初始化成功');
    connection.release();
  })
  .catch(error => {
    console.error('❌ 数据库连接池初始化失败:', error.message);
  });

module.exports = { pool };
EOF

echo "✅ 数据库配置已更新"

# 4. 部署到服务器
echo ""
echo "[4] 部署配置到服务器..."
SERVER="47.109.142.72"

# 复制配置文件到服务器
scp server/.env root@$SERVER:/www/wwwroot/learning-platform/server/.env
scp server/config/database-real.js root@$SERVER:/www/wwwroot/learning-platform/server/config/database-real.js

# 在服务器上重启服务
ssh root@$SERVER << 'REMOTE_CMD'
cd /www/wwwroot/learning-platform
# 备份原配置
cp server/config/database.js server/config/database.backup.js
# 使用真实数据库配置
cp server/config/database-real.js server/config/database.js
# 重启服务
pm2 restart all || (cd server && nohup node app.js > /var/log/learning-platform.log 2>&1 &)
echo "✅ 服务已重启"
REMOTE_CMD

echo ""
echo "======================================"
echo "配置完成！"
echo "======================================"
echo ""
echo "现在维护人员管理页面将显示真实的数据库数据："
echo "1. 访问 http://47.109.142.72/maintenance-admin"
echo "2. 使用维护账号登录"
echo "3. 查看用户管理，应该显示真实的数据库用户"
echo ""
echo "本地开发测试："
echo "1. cd server && npm start"
echo "2. 访问 http://localhost:5173"
echo "3. 登录后访问维护管理页面"

