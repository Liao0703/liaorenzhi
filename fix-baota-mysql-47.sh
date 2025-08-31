#!/bin/bash

# 宝塔服务器MySQL修复脚本
# 服务器: 47.109.142.72
# 用途: 修复注册用户无法在phpMyAdmin中显示的问题

echo "======================================"
echo "宝塔服务器MySQL连接修复脚本"
echo "目标服务器: 47.109.142.72"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}请在宝塔服务器上执行此脚本${NC}"
echo "使用方法: ssh root@47.109.142.72 后执行此脚本"

# 第一步：检查环境
echo -e "\n${GREEN}[步骤1] 检查环境${NC}"
echo "1. 检查Node.js版本:"
node -v 2>/dev/null || echo "Node.js未安装"

echo -e "\n2. 检查MySQL服务状态:"
systemctl status mysql --no-pager 2>/dev/null | head -5 || service mysql status 2>/dev/null | head -5

echo -e "\n3. 检查项目路径:"
if [ -d "/www/wwwroot/47.109.142.72" ]; then
    echo "项目路径: /www/wwwroot/47.109.142.72"
    PROJECT_PATH="/www/wwwroot/47.109.142.72"
elif [ -d "/www/wwwroot/learning-platform" ]; then
    echo "项目路径: /www/wwwroot/learning-platform"
    PROJECT_PATH="/www/wwwroot/learning-platform"
else
    echo -e "${RED}未找到项目路径，请输入正确路径:${NC}"
    read PROJECT_PATH
fi

# 第二步：检查数据库连接
echo -e "\n${GREEN}[步骤2] 检查MySQL数据库${NC}"

echo "请输入MySQL root密码 (如果是admin123或Liao0820，直接回车使用默认):"
read -s MYSQL_PASS

if [ -z "$MYSQL_PASS" ]; then
    # 尝试默认密码
    for pass in "admin123" "Liao0820" "root" ""; do
        echo -n "尝试密码: $(echo $pass | sed 's/./*/g')... "
        if mysql -u root -p"$pass" -e "SHOW DATABASES;" &>/dev/null; then
            MYSQL_PASS="$pass"
            echo -e "${GREEN}成功!${NC}"
            break
        else
            echo -e "${RED}失败${NC}"
        fi
    done
fi

if [ -z "$MYSQL_PASS" ] && ! mysql -u root -e "SHOW DATABASES;" &>/dev/null; then
    echo -e "${RED}无法连接MySQL，需要重置密码${NC}"
    echo "是否重置MySQL密码为admin123? (y/n)"
    read RESET_MYSQL
    
    if [ "$RESET_MYSQL" = "y" ]; then
        echo "正在重置MySQL密码..."
        systemctl stop mysql || service mysql stop
        mysqld_safe --skip-grant-tables &
        sleep 3
        mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin123';
FLUSH PRIVILEGES;
EOF
        pkill -f mysqld
        systemctl start mysql || service mysql start
        MYSQL_PASS="admin123"
        echo -e "${GREEN}密码重置完成${NC}"
    fi
fi

# 第三步：检查数据库和表
echo -e "\n${GREEN}[步骤3] 检查learning_platform数据库${NC}"

mysql -u root -p"$MYSQL_PASS" <<EOF 2>/dev/null
CREATE DATABASE IF NOT EXISTS learning_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learning_platform;

-- 创建users表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'user', 'maintenance') DEFAULT 'user',
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

-- 显示现有用户
SELECT id, username, name, role FROM users;
EOF

echo -e "\n${GREEN}[步骤4] 配置项目数据库连接${NC}"

# 创建.env文件
cd "$PROJECT_PATH"

# 检查是否存在server目录
if [ -d "server" ]; then
    SERVER_PATH="$PROJECT_PATH/server"
else
    SERVER_PATH="$PROJECT_PATH"
fi

echo "创建.env配置文件..."
cat > "$SERVER_PATH/.env" <<EOF
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
EOF

echo -e "${GREEN}.env文件已创建${NC}"

# 第五步：修复数据库连接代码
echo -e "\n${GREEN}[步骤5] 检查并修复数据库连接代码${NC}"

# 检查database.js文件
if [ -f "$SERVER_PATH/config/database.js" ]; then
    echo "找到database.js，检查配置..."
    
    # 备份原文件
    cp "$SERVER_PATH/config/database.js" "$SERVER_PATH/config/database.js.bak"
    
    # 创建修复后的版本
    cat > "$SERVER_PATH/config/database-fixed.js" <<'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
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
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error; // 不降级到内存存储
  }
};

// 初始化连接
testConnection();

module.exports = {
  pool,
  testConnection
};
EOF
    
    echo "是否使用修复后的database.js? (y/n)"
    read USE_FIXED
    if [ "$USE_FIXED" = "y" ]; then
        mv "$SERVER_PATH/config/database-fixed.js" "$SERVER_PATH/config/database.js"
        echo -e "${GREEN}database.js已修复${NC}"
    fi
fi

# 第六步：安装依赖并重启服务
echo -e "\n${GREEN}[步骤6] 安装依赖并重启服务${NC}"

cd "$SERVER_PATH"

# 安装依赖
if [ -f "package.json" ]; then
    echo "安装Node.js依赖..."
    npm install --production
fi

# 停止旧服务
echo "停止旧服务..."
pm2 stop all 2>/dev/null || true
pkill -f "node.*app.js" 2>/dev/null || true

# 启动新服务
echo "启动服务..."
if command -v pm2 &> /dev/null; then
    pm2 start app.js --name learning-platform
    pm2 save
    pm2 startup
else
    nohup node app.js > server.log 2>&1 &
    echo "服务已在后台启动，PID: $!"
fi

# 第七步：测试注册功能
echo -e "\n${GREEN}[步骤7] 测试注册功能${NC}"

sleep 3

echo "测试注册API..."
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "baota_test_'$(date +%s)'", "password": "123456", "name": "宝塔测试用户", "role": "user"}' \
  -s | python -m json.tool 2>/dev/null || \
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "baota_test_'$(date +%s)'", "password": "123456", "name": "宝塔测试用户", "role": "user"}'

echo -e "\n${GREEN}[步骤8] 验证数据库${NC}"

mysql -u root -p"$MYSQL_PASS" -e "USE learning_platform; SELECT id, username, name, role FROM users ORDER BY id DESC LIMIT 5;" 2>/dev/null

echo -e "\n${GREEN}======================================"
echo "修复完成！"
echo "======================================"
echo ""
echo "请检查："
echo "1. 访问 http://47.109.142.72/phpmyadmin 查看users表"
echo "2. 测试注册功能是否正常"
echo "3. 查看服务日志: pm2 logs 或 tail -f server.log"
echo ""
echo "如果还有问题，请提供错误信息。${NC}"

