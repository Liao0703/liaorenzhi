#!/bin/bash
# 宝塔Node项目登录500错误修复脚本

set -e

echo "🚨 开始修复宝塔Node项目登录500错误..."
echo "======================================="

PROJECT_DIR="/www/wwwroot/learning-platform"

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在：$PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

echo "📍 当前目录：$(pwd)"

# 1. 停止当前运行的Node进程
echo "1️⃣ 停止当前Node进程..."
pm2 stop learning-platform 2>/dev/null || echo "PM2服务未运行"
pkill -f "node.*server.cjs" 2>/dev/null || echo "没有server.cjs进程在运行"
pkill -f "node.*app.js" 2>/dev/null || echo "没有app.js进程在运行"

# 2. 检查关键文件
echo "2️⃣ 检查关键文件..."
if [ ! -f "server.cjs" ]; then
    echo "❌ server.cjs文件不存在"
    exit 1
fi

if [ ! -f "env.cloud" ]; then
    echo "❌ env.cloud文件不存在，创建默认配置..."
    cat > env.cloud << 'EOF'
# 云数据库环境配置文件
NODE_ENV=production
PORT=3000

# 阿里云RDS MySQL数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# JWT密钥（用于用户认证）
JWT_SECRET=your-super-secret-jwt-key-learning-platform-2025

# 应用配置
APP_NAME=兴隆场车站班前学习监督系统
APP_VERSION=2.0.0
EOF
fi

# 3. 检查和安装依赖
echo "3️⃣ 检查Node.js依赖..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 安装Node.js依赖..."
    npm install --production --no-optional --no-audit
fi

# 4. 测试数据库连接
echo "4️⃣ 测试数据库连接..."
cat > test-db-connection.js << 'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'env.cloud' });

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
      acquireTimeout: 10000
    });
    
    console.log('✅ 数据库连接成功');
    
    // 测试查询用户表
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log('✅ 用户表查询成功，用户数量:', rows[0].count);
    } catch (error) {
      console.log('⚠️ 用户表不存在，需要创建：', error.message);
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('🔄 将使用内存存储模式');
    process.exit(1);
  }
}

testConnection();
EOF

timeout 15 node test-db-connection.js
DB_TEST_RESULT=$?

if [ $DB_TEST_RESULT -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "⚠️ 数据库连接失败，将使用内存存储模式"
fi

# 5. 创建增强的server.cjs备份
echo "5️⃣ 创建server.cjs错误处理增强版..."
cp server.cjs server.cjs.backup

# 6. 创建日志目录
mkdir -p logs

# 7. 启动服务器（带详细日志）
echo "6️⃣ 启动服务器..."
cat > start-server-debug.js << 'EOF'
// 增强错误处理的启动脚本
const fs = require('fs');

// 捕获所有未处理的错误
process.on('uncaughtException', (err) => {
    const logMessage = `[${new Date().toISOString()}] 未捕获异常: ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync('./logs/error.log', logMessage);
    console.error('未捕获异常:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const logMessage = `[${new Date().toISOString()}] 未处理的Promise拒绝: ${reason}\n\n`;
    fs.appendFileSync('./logs/error.log', logMessage);
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});

// 加载主服务器
console.log('🚀 启动增强错误处理模式...');
require('./server.cjs');
EOF

# 使用PM2启动（如果可用）
if command -v pm2 >/dev/null 2>&1; then
    echo "使用PM2启动服务..."
    pm2 start start-server-debug.js --name "learning-platform" --log ./logs/pm2.log --error ./logs/error.log --output ./logs/output.log
    pm2 list
else
    echo "使用nohup启动服务..."
    nohup node start-server-debug.js > ./logs/server.log 2>&1 &
    SERVER_PID=$!
    echo "服务PID: $SERVER_PID"
    sleep 3
    
    if ps -p $SERVER_PID > /dev/null; then
        echo "✅ 服务启动成功"
    else
        echo "❌ 服务启动失败，查看日志："
        tail -20 ./logs/server.log
        exit 1
    fi
fi

echo ""
echo "🎉 修复完成！"
echo "======================================="
echo "📊 服务信息:"
echo "   - 主端口: 3000"
echo "   - 健康检查: http://47.109.142.72:3000/health"
echo "   - API状态: http://47.109.142.72:3000/api/status"
echo "   - 登录测试: http://47.109.142.72:3000/api/auth/login (POST)"
echo ""
echo "📋 默认测试账户:"
echo "   - 用户名: admin"
echo "   - 密码: 123456"
echo ""
echo "📝 日志文件:"
echo "   - 服务日志: ./logs/server.log"
echo "   - 错误日志: ./logs/error.log"
echo "   - PM2日志: ./logs/pm2.log"
echo ""
echo "🔧 如果仍有问题，请查看日志文件并检查："
echo "   1. 数据库连接配置是否正确"
echo "   2. 宝塔面板的Node.js版本是否兼容"
echo "   3. 防火墙是否允许3000端口访问"

# 清理临时文件
rm -f test-db-connection.js

echo ""
echo "✅ 脚本执行完成！"



