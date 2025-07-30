#!/bin/bash

# 切换到项目目录
cd /Users/renzhiliao/Desktop/learning-platform/learning-platform

# 启动开发服务器
echo "🚀 启动班前学习监督系统..."
echo "📁 项目目录: $(pwd)"
echo "🌐 访问地址: http://localhost:5173/"
echo "📱 局域网访问: http://192.168.1.4:5173/"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev -- --host 0.0.0.0 