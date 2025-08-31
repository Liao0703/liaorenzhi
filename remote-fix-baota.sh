#!/bin/bash

# 远程修复宝塔服务器MySQL问题
# 在本地执行，自动SSH到服务器进行修复

SERVER_IP="47.109.142.72"
echo "======================================"
echo "远程修复宝塔服务器MySQL连接问题"
echo "服务器: $SERVER_IP"
echo "======================================"

# 上传修复脚本
echo "上传修复脚本到服务器..."
scp fix-baota-mysql-47.sh root@$SERVER_IP:/tmp/

# 执行修复
echo "连接服务器并执行修复..."
ssh root@$SERVER_IP << 'REMOTE_SCRIPT'

cd /tmp
chmod +x fix-baota-mysql-47.sh

# 查找项目路径
if [ -d "/www/wwwroot/47.109.142.72" ]; then
    PROJECT_PATH="/www/wwwroot/47.109.142.72"
elif [ -d "/www/wwwroot/learning-platform" ]; then
    PROJECT_PATH="/www/wwwroot/learning-platform"
elif [ -d "/www/server/learning-platform" ]; then
    PROJECT_PATH="/www/server/learning-platform"
else
    echo "查找项目路径..."
    find /www -name "learning-platform" -type d 2>/dev/null | head -1
fi

echo "项目路径: $PROJECT_PATH"

# 快速修复：创建.env文件
if [ -n "$PROJECT_PATH" ]; then
    cd "$PROJECT_PATH"
    
    # 检查server目录
    if [ -d "server" ]; then
        cd server
    fi
    
    # 创建.env文件（使用admin123密码）
    cat > .env << 'EOF'
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=learning_platform

# 服务器配置
PORT=3001
NODE_ENV=production

# JWT配置
JWT_SECRET=your-secret-key-here-change-in-production
EOF

    echo ".env文件已创建"
    
    # 测试MySQL连接
    echo "测试MySQL连接..."
    mysql -u root -padmin123 -e "SHOW DATABASES;" 2>&1 | grep -q "learning_platform"
    if [ $? -eq 0 ]; then
        echo "✅ MySQL连接成功，数据库存在"
        
        # 检查users表
        mysql -u root -padmin123 -e "USE learning_platform; SELECT COUNT(*) as count FROM users;" 2>/dev/null
        
    else
        echo "❌ MySQL连接失败或数据库不存在"
        
        # 尝试创建数据库
        mysql -u root -padmin123 -e "CREATE DATABASE IF NOT EXISTS learning_platform CHARACTER SET utf8mb4;" 2>/dev/null
        
        # 创建users表
        mysql -u root -padmin123 learning_platform << 'SQL'
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    email VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL
    fi
    
    # 重启Node服务
    echo "重启服务..."
    pm2 restart all 2>/dev/null || {
        pkill -f "node.*app.js"
        if [ -f "app.js" ]; then
            nohup node app.js > /tmp/server.log 2>&1 &
        elif [ -f "server/app.js" ]; then
            nohup node server/app.js > /tmp/server.log 2>&1 &
        fi
    }
    
    echo "修复完成！"
fi

REMOTE_SCRIPT

echo ""
echo "======================================"
echo "远程修复执行完成！"
echo "======================================"
echo ""
echo "请检查："
echo "1. 访问 http://$SERVER_IP 测试网站"
echo "2. 访问 http://$SERVER_IP/phpmyadmin 查看数据库"
echo "3. 测试注册功能是否正常"

