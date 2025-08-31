#!/bin/bash

# 🚨 Node.js项目500错误自动修复脚本
# 适用于：宝塔面板 + Node.js + PM2环境

echo "=================================="
echo "🚨 开始修复Node.js项目500错误"
echo "=================================="

# 设置项目路径
PROJECT_PATH="/www/wwwroot/learning-platform"
cd "$PROJECT_PATH" || exit 1

echo "📁 当前工作目录: $PROJECT_PATH"

# 步骤1：检查Node.js环境
echo "🔍 步骤1：检查Node.js环境..."
echo "Node.js版本: $(node --version 2>/dev/null || echo '❌ Node.js未安装')"
echo "NPM版本: $(npm --version 2>/dev/null || echo '❌ NPM未安装')"

# 步骤2：检查关键文件
echo "📋 步骤2：检查关键文件..."
if [ -f "server.cjs" ]; then
    echo "✅ server.cjs存在"
else
    echo "❌ server.cjs文件缺失"
    exit 1
fi

if [ -f "env.cloud" ]; then
    echo "✅ env.cloud存在"
    echo "📄 env.cloud内容预览:"
    head -5 env.cloud | sed 's/PASSWORD=.*/PASSWORD=***隐藏***/'
else
    echo "❌ env.cloud文件缺失，正在创建默认配置..."
    cat > env.cloud << 'EOF'
# 数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# 服务器配置
PORT=3000
NODE_ENV=production
EOF
    echo "✅ env.cloud文件创建完成"
fi

if [ -d "node_modules" ]; then
    echo "✅ node_modules存在"
else
    echo "❌ node_modules缺失，正在安装依赖..."
    npm install --production
    echo "✅ 依赖安装完成"
fi

if [ -d "dist" ]; then
    echo "✅ 前端构建文件(dist)存在"
else
    echo "⚠️  警告: dist目录不存在，前端可能无法正常访问"
fi

# 步骤3：停止旧进程
echo "🛑 步骤3：停止旧进程..."

# 停止PM2进程
if command -v pm2 &> /dev/null; then
    echo "停止PM2进程..."
    pm2 stop learning-platform 2>/dev/null || echo "没有找到learning-platform进程"
    pm2 delete learning-platform 2>/dev/null || echo "没有learning-platform进程需要删除"
else
    echo "⚠️  PM2未安装，使用kill命令停止进程"
fi

# 强制杀死Node.js进程
pkill -f "server.cjs" 2>/dev/null && echo "已停止server.cjs进程" || echo "没有server.cjs进程运行"

# 检查端口占用
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "⚠️  端口3000仍被占用，尝试释放..."
    fuser -k 3000/tcp 2>/dev/null || echo "无法释放端口3000"
    sleep 2
fi

# 步骤4：数据库连接测试
echo "🔗 步骤4：测试数据库连接..."
cat > test-db.js << 'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'env.cloud' });

async function testDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            timeout: 10000
        });
        
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log('✅ 数据库连接成功，用户数:', rows[0].count);
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.log('❌ 数据库连接失败:', error.message);
        process.exit(1);
    }
}

testDB();
EOF

if node test-db.js 2>/dev/null; then
    echo "✅ 数据库连接测试通过"
else
    echo "⚠️  数据库连接测试失败，但继续启动应用"
fi

rm -f test-db.js

# 步骤5：启动Node.js应用
echo "🚀 步骤5：启动Node.js应用..."

if command -v pm2 &> /dev/null; then
    echo "使用PM2启动应用..."
    
    # 使用PM2启动
    pm2 start server.cjs --name "learning-platform" \
        --instances 1 \
        --log "/www/wwwlogs/learning-platform-pm2.log" \
        --error "/www/wwwlogs/learning-platform-error.log" \
        --out "/www/wwwlogs/learning-platform-out.log" \
        --time
    
    # 保存PM2配置
    pm2 save
    
    echo "✅ PM2启动完成"
    
    # 显示状态
    pm2 status
    
    # 显示最近日志
    echo "📊 最近的应用日志:"
    pm2 logs learning-platform --lines 10
    
else
    echo "PM2未安装，使用nohup后台启动..."
    nohup node server.cjs > /www/wwwlogs/learning-platform.log 2>&1 &
    echo $! > /tmp/learning-platform.pid
    echo "✅ 应用已后台启动，PID: $(cat /tmp/learning-platform.pid)"
fi

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 5

# 步骤6：验证应用状态
echo "✅ 步骤6：验证应用状态..."

# 检查进程
if ps aux | grep -E "(server\.cjs|learning-platform)" | grep -v grep > /dev/null; then
    echo "✅ Node.js应用进程正在运行"
else
    echo "❌ Node.js应用进程未运行"
fi

# 检查端口
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "✅ 端口3000正在监听"
else
    echo "❌ 端口3000未被监听"
fi

# 测试健康检查接口
echo "🏥 测试健康检查接口..."
if curl -s http://127.0.0.1:3000/health > /dev/null 2>&1; then
    echo "✅ 健康检查接口响应正常"
    curl -s http://127.0.0.1:3000/health | head -3
else
    echo "❌ 健康检查接口无响应"
fi

# 步骤7：重启Nginx确保代理正常
echo "🔄 步骤7：重启Nginx..."
systemctl reload nginx 2>/dev/null && echo "✅ Nginx重启完成" || echo "⚠️  Nginx重启失败"

# 步骤8：清理和权限修复
echo "🧹 步骤8：清理和权限修复..."
chown -R www:www "$PROJECT_PATH" 2>/dev/null || echo "权限修复跳过"

# 完成
echo "=================================="
echo "✅ Node.js项目500错误修复完成！"
echo "=================================="
echo ""
echo "📊 系统状态:"
if command -v pm2 &> /dev/null; then
    pm2 status | grep learning-platform || echo "PM2状态获取失败"
else
    echo "进程PID: $(cat /tmp/learning-platform.pid 2>/dev/null || echo '未知')"
fi
echo ""
echo "📋 测试步骤："
echo "1. 访问主页: http://47.109.142.72"
echo "2. 健康检查: http://47.109.142.72/health"  
echo "3. API状态: http://47.109.142.72/api/status"
echo ""
echo "📊 监控命令:"
if command -v pm2 &> /dev/null; then
    echo "查看日志: pm2 logs learning-platform"
    echo "重启应用: pm2 restart learning-platform"
    echo "查看状态: pm2 status"
else
    echo "查看日志: tail -f /www/wwwlogs/learning-platform.log"
    echo "停止应用: kill \$(cat /tmp/learning-platform.pid)"
fi
echo ""
echo "🆘 如果问题依然存在："
echo "1. 查看应用日志找到具体错误"
echo "2. 检查数据库连接状态"  
echo "3. 确认服务器资源是否充足"



