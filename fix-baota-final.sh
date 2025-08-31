#!/bin/bash

# 宝塔服务器MySQL修复脚本 - 精确版
# 服务器: 47.109.142.72
# 项目路径: /www/wwwroot/learning-platform
# MySQL密码: Liao0820
# 启动方式: 宝塔Node.js管理器

echo "======================================"
echo "宝塔服务器MySQL连接修复脚本"
echo "服务器: 47.109.142.72"
echo "项目路径: /www/wwwroot/learning-platform"
echo "======================================"

# 在服务器上执行此脚本

# 设置变量
PROJECT_PATH="/www/wwwroot/learning-platform"
MYSQL_PASS="Liao0820"

# 第一步：检查并创建数据库
echo -e "\n[步骤1] 检查MySQL数据库"
mysql -u root -p"$MYSQL_PASS" << EOF
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS learning_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learning_platform;

-- 创建users表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    employee_id VARCHAR(50),
    company VARCHAR(100),
    department VARCHAR(100),
    team VARCHAR(100),
    job_type VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 显示表结构
DESCRIBE users;

-- 显示现有用户数量
SELECT COUNT(*) as total_users FROM users;
SELECT id, username, name, role FROM users ORDER BY id DESC LIMIT 5;
EOF

# 第二步：创建.env配置文件
echo -e "\n[步骤2] 创建.env配置文件"

# 检查server目录是否存在
if [ -d "$PROJECT_PATH/server" ]; then
    ENV_PATH="$PROJECT_PATH/server/.env"
    SERVER_PATH="$PROJECT_PATH/server"
else
    ENV_PATH="$PROJECT_PATH/.env"
    SERVER_PATH="$PROJECT_PATH"
fi

cat > "$ENV_PATH" << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=$MYSQL_PASS
DB_NAME=learning_platform

# 服务器配置
PORT=3001
NODE_ENV=production

# JWT配置
JWT_SECRET=your-secret-key-here-change-in-production

# CORS配置
CORS_ORIGIN=http://47.109.142.72,http://localhost:5173
EOF

echo ".env文件已创建在: $ENV_PATH"

# 第三步：修复database.js文件
echo -e "\n[步骤3] 修复数据库连接文件"

if [ -f "$SERVER_PATH/config/database.js" ]; then
    # 备份原文件
    cp "$SERVER_PATH/config/database.js" "$SERVER_PATH/config/database.js.bak.$(date +%Y%m%d_%H%M%S)"
    
    # 创建修复版本
    cat > "$SERVER_PATH/config/database.js" << 'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
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

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    // 确保不使用内存存储
    global.memoryDB = null;
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    // 不要降级到内存存储，直接报错
    throw error;
  }
};

// 初始化连接
testConnection().catch(err => {
  console.error('数据库初始化失败:', err);
});

module.exports = {
  pool,
  testConnection
};
EOF
    echo "database.js已修复"
fi

# 第四步：修复auth.js中的undefined参数问题
echo -e "\n[步骤4] 修复注册API参数问题"

if [ -f "$SERVER_PATH/routes/auth.js" ]; then
    # 备份原文件
    cp "$SERVER_PATH/routes/auth.js" "$SERVER_PATH/routes/auth.js.bak.$(date +%Y%m%d_%H%M%S)"
    
    # 修复undefined参数问题
    sed -i 's/\[username, hashedPassword, name, role, email, phone, department\]/[username, hashedPassword, name, role, email || null, phone || null, department || null]/g' "$SERVER_PATH/routes/auth.js"
    
    echo "auth.js参数问题已修复"
fi

# 第五步：安装依赖
echo -e "\n[步骤5] 安装Node.js依赖"
cd "$SERVER_PATH"
if [ -f "package.json" ]; then
    npm install --production
fi

# 第六步：在宝塔面板重启Node.js项目
echo -e "\n[步骤6] 重启Node.js服务"

# 停止可能运行的进程
pkill -f "node.*app.js" 2>/dev/null || true
pm2 stop all 2>/dev/null || true

echo "请在宝塔面板中执行以下操作："
echo "1. 打开宝塔面板 -> 网站 -> Node项目"
echo "2. 找到 learning-platform 项目"
echo "3. 点击 '停止' 按钮"
echo "4. 点击 '启动' 按钮"
echo ""
echo "或者使用命令行启动："

# 尝试使用PM2启动
if command -v pm2 &> /dev/null; then
    cd "$SERVER_PATH"
    pm2 start app.js --name learning-platform-server
    pm2 save
    echo "已使用PM2启动服务"
else
    # 使用nohup启动
    cd "$SERVER_PATH"
    nohup node app.js > /var/log/learning-platform.log 2>&1 &
    echo "已使用nohup启动服务，PID: $!"
fi

# 第七步：测试注册功能
echo -e "\n[步骤7] 测试注册功能"
sleep 3

TEST_USER="test_$(date +%s)"
echo "注册测试用户: $TEST_USER"

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USER\", \"password\": \"123456\", \"name\": \"测试用户\", \"role\": \"user\"}" \
  -s

echo -e "\n\n[步骤8] 验证数据库中的用户"
mysql -u root -p"$MYSQL_PASS" -e "USE learning_platform; SELECT id, username, name, role FROM users WHERE username = '$TEST_USER';"

# 第九步：创建测试页面
echo -e "\n[步骤9] 创建测试页面"
cat > "$PROJECT_PATH/test-mysql.php" << 'EOF'
<?php
$host = 'localhost';
$user = 'root';
$pass = 'Liao0820';
$db = 'learning_platform';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("连接失败: " . $conn->connect_error);
}

echo "<h2>MySQL连接成功！</h2>";

$sql = "SELECT id, username, name, role FROM users ORDER BY id DESC LIMIT 10";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo "<h3>最近注册的用户：</h3>";
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>用户名</th><th>姓名</th><th>角色</th></tr>";
    while($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row["id"] . "</td>";
        echo "<td>" . $row["username"] . "</td>";
        echo "<td>" . $row["name"] . "</td>";
        echo "<td>" . $row["role"] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "没有用户数据";
}

$conn->close();
?>
EOF

echo "测试页面已创建: http://47.109.142.72/test-mysql.php"

echo -e "\n======================================"
echo "修复完成！"
echo "======================================"
echo ""
echo "请检查："
echo "1. 访问 http://47.109.142.72/test-mysql.php 查看用户列表"
echo "2. 访问 http://47.109.142.72/phpmyadmin"
echo "   - 用户名: root"
echo "   - 密码: Liao0820"
echo "   - 查看 learning_platform 数据库的 users 表"
echo "3. 在前端测试注册新用户"
echo "4. 查看日志: tail -f /var/log/learning-platform.log"
echo ""
echo "如果服务未启动，请在宝塔面板的Node项目管理中手动启动"

