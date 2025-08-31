#!/bin/bash

# 快速本地安装PM2并启动应用
echo "🚀 本地安装PM2方案"
echo "=================="

# 进入项目目录
cd /www/wwwroot/learning-platform/server

# 本地安装pm2
echo "📦 在项目中本地安装PM2..."
npm install pm2 --registry https://registry.npmjs.org/

# 检查安装
if [ -f "node_modules/.bin/pm2" ]; then
    echo "✅ PM2本地安装成功！"
    
    # 启动应用
    echo "🚀 启动应用..."
    ./node_modules/.bin/pm2 start app-simple.js --name learning-platform -- --port 3002
    
    # 显示状态
    echo "📊 应用状态："
    ./node_modules/.bin/pm2 status
    
    echo ""
    echo "✅ 部署完成！"
    echo ""
    echo "常用命令："
    echo "  查看日志: ./node_modules/.bin/pm2 logs learning-platform"
    echo "  重启应用: ./node_modules/.bin/pm2 restart learning-platform"
    echo "  停止应用: ./node_modules/.bin/pm2 stop learning-platform"
    echo ""
    echo "或者使用npx："
    echo "  npx pm2 status"
    echo "  npx pm2 logs learning-platform"
else
    echo "❌ PM2安装失败，请检查网络连接"
fi
