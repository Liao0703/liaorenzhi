#!/bin/bash

# PM2服务器快速部署脚本
# 在服务器上执行此脚本

set -e

echo "🚀 铁路学习平台 - PM2部署脚本"
echo "================================"

# 进入项目目录
cd /www/wwwroot/learning-platform/server

# 1. 安装PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "📦 正在安装PM2..."
    npm install -g pm2
    
    # 设置PM2开机自启动
    pm2 startup systemd -u root --hp /root
fi

# 2. 停止旧的PM2进程（如果存在）
echo "🔄 停止旧进程..."
pm2 delete learning-platform 2>/dev/null || true

# 3. 创建日志目录
echo "📁 创建日志目录..."
mkdir -p /www/wwwroot/learning-platform/logs

# 4. 启动应用
echo "🚀 启动应用..."
pm2 start app-simple.js --name learning-platform -- --port 3002

# 5. 保存PM2配置
echo "💾 保存PM2配置..."
pm2 save

# 6. 显示状态
echo ""
echo "✅ 部署完成！"
echo ""
pm2 status

echo ""
echo "📊 查看日志命令："
echo "  pm2 logs learning-platform"
echo ""
echo "🔧 其他常用命令："
echo "  pm2 restart learning-platform  # 重启"
echo "  pm2 stop learning-platform     # 停止"
echo "  pm2 monit                      # 监控"
