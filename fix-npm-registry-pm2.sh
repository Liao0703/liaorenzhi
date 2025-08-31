#!/bin/bash

# 修复npm镜像源并安装PM2
echo "🔧 修复npm镜像源并安装PM2..."

# 1. 查看当前npm镜像源
echo "📍 当前npm镜像源："
npm config get registry

# 2. 临时使用官方源安装PM2
echo "📦 使用npm官方源安装PM2..."
npm install -g pm2 --registry https://registry.npmjs.org/

# 3. 如果官方源也失败，尝试淘宝镜像
if [ $? -ne 0 ]; then
    echo "🔄 尝试使用淘宝镜像源..."
    npm install -g pm2 --registry https://registry.npmmirror.com/
fi

# 4. 如果还是失败，尝试cnpm
if [ $? -ne 0 ]; then
    echo "🔄 尝试使用cnpm..."
    npm install -g cnpm --registry https://registry.npmmirror.com/
    cnpm install -g pm2
fi

# 5. 验证安装
if command -v pm2 &> /dev/null; then
    echo "✅ PM2安装成功！"
    pm2 --version
else
    echo "❌ PM2安装失败"
fi
