#!/bin/bash

# 修复版本 - 快速部署服务器代码到云服务器
SERVER_IP="116.62.65.246"
SERVER_USER="root"
REMOTE_DIR="/opt/learning-platform"

echo "🚀 修复版快速部署后端服务到云服务器..."

# 1. 首先在服务器上创建目录
echo "📁 创建远程目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR && echo '目录创建成功'"

# 2. 上传server目录
echo "📤 上传服务器文件..."
scp -r server/* $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# 3. 在服务器上执行启动命令
echo "🛠️  在服务器上启动服务..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/learning-platform

echo "📍 当前目录: $(pwd)"
echo "📋 目录内容:"
ls -la

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "📦 安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 安装依赖
echo "📦 安装项目依赖..."
if [ -f "package.json" ]; then
    npm install
else
    echo "❌ 找不到package.json文件"
    ls -la
    exit 1
fi

# 创建正确的环境配置
echo "⚙️  创建环境配置..."
cat > .env << 'ENVEOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=railway-learning-platform-super-secret-jwt-key-2024
CORS_ORIGIN=http://116.62.65.246:3000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
ENVEOF

echo "✅ 环境配置已创建"

# 创建uploads目录
mkdir -p uploads
echo "✅ uploads目录已创建"

# 停止旧服务
echo "🛑 停止旧服务..."
pkill -f "node.*app.js" 2>/dev/null && echo "已停止旧服务" || echo "没有运行的旧服务"

# 检查app.js文件
if [ ! -f "app.js" ]; then
    echo "❌ app.js文件不存在！"
    echo "📋 当前目录文件:"
    ls -la
    exit 1
fi

# 启动新服务
echo "🎯 启动服务..."
nohup node app.js > server.log 2>&1 &
SERVER_PID=$!

echo "✅ 服务已启动，PID: $SERVER_PID"

# 等待启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查进程是否还在运行
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ 服务进程运行正常"
else
    echo "❌ 服务进程已退出"
    echo "📋 查看错误日志:"
    cat server.log
    exit 1
fi

# 测试服务
echo "🔍 测试服务..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "📊 健康检查响应:"
    curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/health
    echo ""
    echo "🌐 API地址: http://116.62.65.246:3001"
    echo "🔍 健康检查: http://116.62.65.246:3001/health"
    
    # 显示服务状态
    echo ""
    echo "📊 服务状态:"
    ps aux | grep "node.*app.js" | grep -v grep
    echo ""
    echo "🔌 端口监听:"
    netstat -tlnp | grep 3001
else
    echo "❌ 服务启动失败"
    echo "📋 查看详细日志:"
    cat server.log
    echo ""
    echo "🔌 检查端口:"
    netstat -tlnp | grep 3001
    exit 1
fi
EOF

DEPLOY_EXIT_CODE=$?

echo ""
if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo "🎉 部署完成！"
    echo ""
    echo "🔗 测试链接："
    echo "   健康检查: http://116.62.65.246:3001/health"
    echo "   API基础: http://116.62.65.246:3001/api"
    echo ""
    echo "🧪 本地测试:"
    echo "   curl http://116.62.65.246:3001/health"
else
    echo "❌ 部署失败，请检查上面的错误信息"
fi