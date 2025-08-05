#!/bin/bash

# 铁路学习平台后端服务启动脚本
echo "🚀 启动铁路学习平台后端服务..."

# 进入服务器目录
cd server

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 设置环境变量
export PORT=3001
export NODE_ENV=production
export JWT_SECRET="railway-learning-platform-super-secret-jwt-key-2024"
export CORS_ORIGIN="http://116.62.65.246:3000"

# 创建uploads目录
mkdir -p uploads

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 检查端口是否被占用
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 3001 已被占用，尝试结束占用进程..."
    pkill -f "node.*app.js"
    sleep 2
fi

# 启动服务器
echo "🎯 启动后端服务在端口 3001..."
echo "🌐 API地址: http://116.62.65.246:3001"
echo "🔍 健康检查: http://116.62.65.246:3001/health"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "------------------------"

# 使用 nohup 在后台运行，这样即使SSH断开也能继续运行
# nohup node app.js > server.log 2>&1 &

# 或者直接前台运行（用于调试）
node app.js