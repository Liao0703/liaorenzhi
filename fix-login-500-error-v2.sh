#!/bin/bash
# 宝塔Node项目登录500错误修复脚本 v2 - 修复ES module问题

set -e

echo "🚨 开始修复宝塔Node项目登录500错误 v2..."
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

# 4. 测试数据库连接 - 使用.cjs扩展名避免ES module问题
echo "4️⃣ 测试数据库连接..."
cat > test-db-connection.cjs << 'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'env.cloud' });

async function testConnection() {
  try {
    console.log('🔗 连接到数据库:', process.env.DB_HOST);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 10000
    });
    
    console.log('✅ 数据库连接成功');
    
    // 测试查询用户表
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users LIMIT 1');
      console.log('✅ 用户表查询成功，用户数量:', rows[0].count);
      console.log('📊 数据库状态: 正常');
    } catch (error) {
      if (error.message.includes("doesn't exist")) {
        console.log('⚠️ 用户表不存在，需要创建用户表');
        console.log('💡 建议执行: CREATE TABLE users...');
      } else {
        console.log('⚠️ 用户表查询异常:', error.message);
      }
    }
    
    await connection.end();
    console.log('🔌 数据库连接已关闭');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('🔄 系统将使用内存存储模式');
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS解析失败，请检查网络连接');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 连接超时，请检查防火墙和安全组设置');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 访问被拒绝，请检查数据库用户名密码');
    }
    
    process.exit(1);
  }
}

testConnection();
EOF

echo "🧪 运行数据库连接测试（15秒超时）..."
timeout 15 node test-db-connection.cjs
DB_TEST_RESULT=$?

if [ $DB_TEST_RESULT -eq 0 ]; then
    echo "✅ 数据库连接正常，使用数据库模式"
    USE_DB_MODE=true
else
    echo "⚠️ 数据库连接失败，使用内存存储模式"
    USE_DB_MODE=false
fi

# 5. 创建增强的启动脚本
echo "5️⃣ 创建增强错误处理启动脚本..."

# 创建日志目录
mkdir -p logs

# 创建增强版启动脚本，使用.cjs扩展名
cat > start-server-enhanced.cjs << 'EOF'
// 增强错误处理的启动脚本
const fs = require('fs');
const path = require('path');

// 创建日志写入函数
function writeLog(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    // 写入到控制台
    console.log(logMessage.trim());
    
    // 写入到文件
    try {
        fs.appendFileSync('./logs/server.log', logMessage);
    } catch (err) {
        console.error('写入日志文件失败:', err.message);
    }
}

// 捕获所有未处理的错误
process.on('uncaughtException', (err) => {
    const errorMsg = `未捕获异常: ${err.message}\n堆栈: ${err.stack}`;
    writeLog('ERROR', errorMsg);
    
    try {
        fs.appendFileSync('./logs/crash.log', `[${new Date().toISOString()}] 进程崩溃: ${err.message}\n${err.stack}\n\n`);
    } catch (logErr) {
        console.error('写入崩溃日志失败:', logErr);
    }
    
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const errorMsg = `未处理的Promise拒绝: ${reason}`;
    writeLog('ERROR', errorMsg);
    
    try {
        fs.appendFileSync('./logs/crash.log', `[${new Date().toISOString()}] Promise拒绝: ${reason}\n\n`);
    } catch (logErr) {
        console.error('写入崩溃日志失败:', logErr);
    }
});

// 启动信息
writeLog('INFO', '🚀 启动增强错误处理模式...');
writeLog('INFO', `Node.js版本: ${process.version}`);
writeLog('INFO', `工作目录: ${process.cwd()}`);

// 检查关键文件
const requiredFiles = ['server.cjs', 'env.cloud', 'package.json'];
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        writeLog('INFO', `✅ 关键文件存在: ${file}`);
    } else {
        writeLog('ERROR', `❌ 关键文件缺失: ${file}`);
    }
}

// 加载主服务器
try {
    writeLog('INFO', '📦 加载主服务器模块...');
    require('./server.cjs');
    writeLog('INFO', '✅ 服务器模块加载成功');
} catch (error) {
    writeLog('ERROR', `💥 服务器启动失败: ${error.message}`);
    writeLog('ERROR', `堆栈信息: ${error.stack}`);
    process.exit(1);
}
EOF

# 6. 启动服务器
echo "6️⃣ 启动服务器..."

# 检查PM2是否可用
if command -v pm2 >/dev/null 2>&1; then
    echo "📋 使用PM2启动服务..."
    
    # 创建PM2配置
    cat > ecosystem-fix.config.js << EOF
module.exports = {
  apps: [{
    name: 'learning-platform-fixed',
    script: './start-server-enhanced.cjs',
    cwd: '/www/wwwroot/learning-platform',
    env: {
      NODE_ENV: 'production',
      PORT: '3000'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-output.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    restart_delay: 5000,
    max_restarts: 5,
    min_uptime: '10s',
    kill_timeout: 5000
  }]
};
EOF
    
    pm2 start ecosystem-fix.config.js
    pm2 list
    
    # 检查启动状态
    sleep 3
    if pm2 describe learning-platform-fixed | grep -q "online"; then
        echo "✅ PM2服务启动成功"
        PM2_SUCCESS=true
    else
        echo "❌ PM2服务启动失败"
        PM2_SUCCESS=false
    fi
    
else
    echo "📋 使用nohup启动服务..."
    nohup node start-server-enhanced.cjs > ./logs/nohup.log 2>&1 &
    SERVER_PID=$!
    echo "📊 服务PID: $SERVER_PID"
    
    sleep 5
    
    if ps -p $SERVER_PID > /dev/null; then
        echo "✅ nohup服务启动成功"
        PM2_SUCCESS=true
    else
        echo "❌ nohup服务启动失败，查看日志："
        tail -20 ./logs/nohup.log
        PM2_SUCCESS=false
    fi
fi

# 7. 服务验证
echo "7️⃣ 验证服务状态..."
sleep 3

# 检查端口占用
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "✅ 端口3000正在监听"
    PORT_OK=true
else
    echo "❌ 端口3000未在监听"
    PORT_OK=false
fi

# HTTP健康检查
echo "🌐 执行HTTP健康检查..."
if curl -s --connect-timeout 5 http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ HTTP健康检查通过"
    HTTP_OK=true
else
    echo "❌ HTTP健康检查失败"
    HTTP_OK=false
fi

# 测试登录API
echo "🔐 测试登录API..."
LOGIN_TEST=$(curl -s --connect-timeout 5 -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"123456"}' \
    http://localhost:3000/api/auth/login 2>/dev/null | head -c 100)

if echo "$LOGIN_TEST" | grep -q "success\|登录"; then
    echo "✅ 登录API测试通过"
    LOGIN_OK=true
else
    echo "❌ 登录API测试失败"
    echo "响应内容: $LOGIN_TEST"
    LOGIN_OK=false
fi

echo ""
echo "🎉 修复脚本执行完成！"
echo "======================================="
echo "📊 修复结果汇总:"

if [ "$PM2_SUCCESS" = true ] && [ "$PORT_OK" = true ] && [ "$HTTP_OK" = true ] && [ "$LOGIN_OK" = true ]; then
    echo "🟢 状态: 修复成功！服务完全正常"
    OVERALL_STATUS="SUCCESS"
else
    echo "🟡 状态: 部分修复成功，需要进一步检查"
    OVERALL_STATUS="PARTIAL"
fi

echo "   - 进程启动: $([ "$PM2_SUCCESS" = true ] && echo "✅ 成功" || echo "❌ 失败")"
echo "   - 端口监听: $([ "$PORT_OK" = true ] && echo "✅ 正常" || echo "❌ 异常")"
echo "   - HTTP服务: $([ "$HTTP_OK" = true ] && echo "✅ 正常" || echo "❌ 异常")"
echo "   - 登录功能: $([ "$LOGIN_OK" = true ] && echo "✅ 正常" || echo "❌ 异常")"
echo "   - 数据库连接: $([ "$USE_DB_MODE" = true ] && echo "✅ 数据库模式" || echo "⚠️ 内存模式")"

echo ""
echo "🌐 访问信息:"
echo "   - 前端页面: http://47.109.142.72:3000/"
echo "   - 健康检查: http://47.109.142.72:3000/health"
echo "   - API状态: http://47.109.142.72:3000/api/status"
echo "   - 登录接口: http://47.109.142.72:3000/api/auth/login"

echo ""
echo "📋 测试账户:"
echo "   - 管理员: admin / 123456"
echo "   - 维护账号: maintenance / 123456"
echo "   - 普通用户: zhangsan / 123456"

echo ""
echo "📝 日志文件:"
echo "   - 服务日志: ./logs/server.log"
echo "   - PM2日志: ./logs/pm2-combined.log"
echo "   - 崩溃日志: ./logs/crash.log"

if [ "$OVERALL_STATUS" = "PARTIAL" ]; then
    echo ""
    echo "🔧 故障排查建议:"
    echo "   1. 查看详细日志: tail -f ./logs/server.log"
    echo "   2. 检查进程状态: ps aux | grep node"
    echo "   3. 检查端口占用: netstat -tlnp | grep 3000"
    echo "   4. 重启服务: pm2 restart learning-platform-fixed"
fi

# 清理临时文件
echo ""
echo "🧹 清理临时文件..."
rm -f test-db-connection.cjs

echo ""
echo "✅ 修复脚本执行完成！"

# 最终状态检查
if [ "$OVERALL_STATUS" = "SUCCESS" ]; then
    echo "🎊 恭喜！你的登录500错误已经修复成功！"
    exit 0
else
    echo "⚠️ 修复未完全成功，请按照上述建议进行进一步排查"
    exit 1
fi



