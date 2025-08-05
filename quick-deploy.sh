#!/bin/bash

echo "🚀 快速部署脚本"
echo "================"

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查是否有 PM2
if command -v pm2 &> /dev/null; then
    echo "🚀 使用 PM2 启动应用..."
    pm2 start ecosystem.config.js --env production
    echo "✅ 部署完成！"
    echo "📊 查看状态: pm2 status"
    echo "📋 查看日志: pm2 logs learning-platform"
    echo "🔄 重启应用: pm2 restart learning-platform"
    echo "⏹️  停止应用: pm2 stop learning-platform"
else
    echo "🚀 直接启动服务器..."
    echo "💡 提示：安装 PM2 可以后台运行"
    echo "   安装命令: npm install -g pm2"
    echo ""
    echo "✅ 部署完成！"
    echo "🌐 访问地址: http://localhost:3000"
    echo "🔧 健康检查: http://localhost:3000/health"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    
    # 直接启动服务器
    node server.js
fi 