#!/bin/bash

echo "🚀 启动生产环境服务器..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

# 启动生产服务器
echo "🌐 启动生产服务器..."
echo "📁 项目目录: $(pwd)"
echo "🌐 访问地址: http://localhost:${PORT:-3000}/"
echo ""

# 使用环境变量 PORT，如果没有设置则使用 3000
PORT=${PORT:-3000} npm start 