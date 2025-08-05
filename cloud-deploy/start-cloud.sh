#!/bin/bash

echo "🚀 启动云服务器应用..."

# 设置环境变量
export PORT=${PORT:-3000}
export NODE_ENV=production

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 检查端口占用
echo "🔍 检查端口占用..."
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，正在停止占用进程..."
    lsof -ti:$PORT | xargs kill -9
    sleep 2
fi

# 启动服务器
echo "🌐 服务器端口: $PORT"
echo "🔧 环境模式: $NODE_ENV"
echo ""

# 后台启动服务器
nohup node server.js > app.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 检查服务器是否启动成功
if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "✅ 服务器启动成功！"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me):$PORT"
    echo "🔧 健康检查: http://$(curl -s ifconfig.me):$PORT/health"
    echo "📊 API状态: http://$(curl -s ifconfig.me):$PORT/api/status"
    echo "📋 进程ID: $SERVER_PID"
    echo "📄 日志文件: app.log"
else
    echo "❌ 服务器启动失败"
    exit 1
fi
