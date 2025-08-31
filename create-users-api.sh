#!/bin/bash

# 在服务器上创建用户查看API
SERVER="47.109.142.72"

echo "创建Node.js用户查看API"
echo "请SSH登录服务器后执行："
echo "ssh root@$SERVER"
echo ""
echo "然后运行："

cat << 'CREATE_API'
# 创建API文件
cat > /www/wwwroot/learning-platform/server/users-api.js << 'EOF'
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

// 数据库配置
const dbConfig = {
  host: 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com',
  user: 'admin123',
  password: 'Liao0820',
  database: 'learning_platform'
};

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 用户列表API
app.get('/api/all-users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, username, name, role, email, phone, department, created_at FROM users ORDER BY id DESC'
    );
    await connection.end();
    
    res.json({
      success: true,
      total: rows.length,
      users: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动服务
const PORT = 3003;
app.listen(PORT, () => {
  console.log(`用户API运行在端口 ${PORT}`);
});
EOF

# 启动API服务
cd /www/wwwroot/learning-platform/server
nohup node users-api.js > users-api.log 2>&1 &

echo "API已启动，访问: http://47.109.142.72:3003/api/all-users"
CREATE_API
