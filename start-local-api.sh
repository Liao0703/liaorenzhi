#!/bin/bash

echo "🚀 启动本地学习平台API服务器"
echo "================================"

# 设置环境变量
export PORT=3001
export NODE_ENV=development
export JWT_SECRET="railway-learning-platform-local-dev-key"
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=""
export DB_NAME=learning_platform
export CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:5175,http://116.62.65.246:3000"

# 进入服务器目录
cd server

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 启动服务
echo "🎯 启动API服务器在端口 3001..."
echo "🌐 API地址: http://localhost:3001"
echo "🔍 健康检查: http://localhost:3001/health"
echo "📊 支持跨域访问云服务器前端"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "========================"

node app.js