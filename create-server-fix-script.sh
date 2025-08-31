#!/bin/bash

# 在服务器上创建Node.js 500错误修复脚本

cat > fix-nodejs-500.sh << 'SCRIPT_EOF'
#!/bin/bash

# 🚨 Node.js项目500错误自动修复脚本
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
else
    echo "❌ env.cloud文件缺失，正在创建..."
    cat > env.cloud << 'ENV_EOF'
# 数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# 服务器配置
PORT=3000
NODE_ENV=production
ENV_EOF
    echo "✅ env.cloud文件创建完成"
fi

# 步骤3：停止旧进程
echo "🛑 步骤3：停止旧进程..."

# 停止PM2进程
if command -v pm2 &> /dev/null; then
    echo "停止PM2进程..."
    pm2 stop all 2>/dev/null || echo "没有PM2进程"
    pm2 delete all 2>/dev/null || echo "没有PM2进程需要删除"
else
    echo "⚠️  PM2未安装"
fi

# 强制杀死Node.js进程
pkill -f "server.cjs" 2>/dev/null && echo "已停止server.cjs进程" || echo "没有server.cjs进程运行"
pkill -f "node.*3000" 2>/dev/null && echo "已停止3000端口进程" || echo "没有3000端口进程"

# 检查端口占用
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "⚠️  端口3000仍被占用，尝试释放..."
    fuser -k 3000/tcp 2>/dev/null || echo "端口释放完成"
    sleep 2
fi

# 步骤4：检查依赖
echo "📦 步骤4：检查依赖..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules存在"
else
    echo "❌ node_modules缺失，正在安装..."
    npm install --production
fi

# 步骤5：启动Node.js应用
echo "🚀 步骤5：启动Node.js应用..."

if command -v pm2 &> /dev/null; then
    echo "使用PM2启动应用..."
    pm2 start server.cjs --name "learning-platform" --instances 1
    pm2 save
    echo "✅ PM2启动完成"
    pm2 status
else
    echo "PM2未安装，使用nohup后台启动..."
    nohup node server.cjs > /www/wwwlogs/learning-platform.log 2>&1 &
    echo $! > /tmp/learning-platform.pid
    echo "✅ 应用已后台启动，PID: $(cat /tmp/learning-platform.pid)"
fi

# 等待启动
echo "⏳ 等待应用启动..."
sleep 5

# 步骤6：验证状态
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

# 测试健康检查
echo "🏥 测试本地健康检查..."
if curl -s http://127.0.0.1:3000/health 2>/dev/null | grep -q "ok"; then
    echo "✅ 健康检查正常"
else
    echo "⚠️  健康检查异常，查看日志："
    if command -v pm2 &> /dev/null; then
        pm2 logs learning-platform --lines 5
    else
        tail -5 /www/wwwlogs/learning-platform.log 2>/dev/null || echo "日志文件不存在"
    fi
fi

# 重启Nginx
echo "🔄 重启Nginx..."
systemctl reload nginx 2>/dev/null && echo "✅ Nginx重启完成" || echo "⚠️  Nginx重启失败"

echo "=================================="
echo "✅ Node.js项目修复完成！"
echo "=================================="
echo ""
echo "📊 测试访问："
echo "1. 主页: http://47.109.142.72"
echo "2. 健康检查: http://47.109.142.72/health"
echo "3. API状态: http://47.109.142.72/api/status"
echo ""
if command -v pm2 &> /dev/null; then
    echo "📊 监控命令: pm2 logs learning-platform"
else
    echo "📊 查看日志: tail -f /www/wwwlogs/learning-platform.log"
fi

SCRIPT_EOF

chmod +x fix-nodejs-500.sh
echo "✅ 修复脚本已创建完成！"
echo "现在运行: bash fix-nodejs-500.sh"



