#!/bin/bash

# 切换到本地MySQL数据库
SERVER="47.109.142.72"

echo "======================================"
echo "切换到本地MySQL数据库"
echo "======================================"

ssh root@$SERVER << 'SWITCH_DB'

echo "[1] 备份当前配置..."
cp /www/wwwroot/learning-platform/.env /www/wwwroot/learning-platform/.env.rds.backup
cp /www/wwwroot/learning-platform/server/.env /www/wwwroot/learning-platform/server/.env.backup 2>/dev/null

echo "[2] 更新为本地MySQL配置..."

# 更新根目录的.env
cat > /www/wwwroot/learning-platform/.env << 'EOF'
# 数据库配置 - 本地MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# 服务器配置
PORT=3002
NODE_ENV=production

# JWT配置
JWT_SECRET=your-secret-key-here-change-in-production
EOF

# 更新server目录的.env
cat > /www/wwwroot/learning-platform/server/.env << 'EOF'
# 数据库配置 - 本地MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# 服务器配置
PORT=3002
NODE_ENV=production

# JWT配置
JWT_SECRET=your-secret-key-here-change-in-production
EOF

echo "[3] 确保本地数据库存在..."
mysql -u root -pLiao0820 << 'SQL'
CREATE DATABASE IF NOT EXISTS learning_platform CHARACTER SET utf8mb4;
USE learning_platform;

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认用户（如果不存在）
INSERT IGNORE INTO users (username, password, name, role) VALUES
('admin', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8w8k5QqS3fpgSNfXgKwgKJ0V8k7eQm', '系统管理员', 'admin'),
('demo', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8w8k5QqS3fpgSNfXgKwgKJ0V8k7eQm', '演示用户', 'user'),
('maintenance', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8w8k5QqS3fpgSNfXgKwgKJ0V8k7eQm', '维护用户', 'maintenance');

SELECT COUNT(*) as total FROM users;
SQL

echo "[4] 重启Node服务..."
pkill -f "node.*app.js"
sleep 2

cd /www/wwwroot/learning-platform/server
nohup /www/server/nodejs/v18.20.2/bin/node app.js > /var/log/learning-platform.log 2>&1 &

echo "新进程PID: $!"

sleep 3

echo "[5] 测试新配置..."
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "local_test_'$(date +%s)'", "password": "123456", "name": "本地测试", "role": "user"}' \
  -s | python -m json.tool

echo -e "\n[6] 查看本地数据库用户..."
mysql -u root -pLiao0820 -e "USE learning_platform; SELECT id, username, name, role FROM users;" 2>/dev/null

SWITCH_DB

echo ""
echo "======================================"
echo "切换完成！"
echo "======================================"
echo ""
echo "现在你可以在phpMyAdmin中看到新注册的用户了："
echo "http://47.109.142.72:8888/phpmyadmin/"
echo "数据库: learning_platform"
echo "表: users"

