#!/bin/bash

# 本地启动后端服务器脚本
echo "🚀 启动本地后端服务..."

# 设置环境变量
export PORT=3001
export NODE_ENV=development
export JWT_SECRET="railway-learning-platform-local-dev-key"
export CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 创建uploads目录
mkdir -p uploads

# 启动服务
echo "🎯 启动开发服务器在端口 3001..."
echo "🌐 本地API地址: http://localhost:3001"
echo "🔍 健康检查: http://localhost:3001/health"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "------------------------"

node app.js