#!/bin/bash

echo "🌐 设置云服务器前端访问本地API"
echo "==============================="

# 检查ngrok是否安装
if ! command -v ngrok &> /dev/null; then
    echo "📦 安装ngrok..."
    
    # macOS安装方法
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "请手动安装ngrok: https://ngrok.com/download"
            echo "或安装Homebrew后运行此脚本"
            exit 1
        fi
    else
        echo "请手动安装ngrok: https://ngrok.com/download"
        exit 1
    fi
fi

echo "✅ ngrok已安装"

# 检查本地API服务器是否运行
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ 本地API服务器未运行，请先启动："
    echo "./start-local-api.sh"
    exit 1
fi

echo "✅ 本地API服务器运行正常"
echo ""
echo "🚀 启动ngrok隧道..."
echo "==================="
echo "1. ngrok将为您的本地API服务器创建一个公网地址"
echo "2. 复制显示的https地址"
echo "3. 修改云服务器前端代码中的API地址"
echo ""
echo "按任意键继续..."
read -n 1

ngrok http 3001