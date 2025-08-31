#!/bin/bash

# PM2服务器安装脚本
echo "🚀 开始安装PM2..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 全局安装PM2
echo "📦 安装PM2..."
npm install -g pm2

# 检查PM2是否安装成功
if command -v pm2 &> /dev/null; then
    echo "✅ PM2安装成功！"
    pm2 --version
else
    echo "❌ PM2安装失败，请检查npm权限"
    exit 1
fi

# 设置PM2开机自启动
echo "🔧 配置PM2开机自启动..."
pm2 startup systemd -u root --hp /root
pm2 save

echo "✅ PM2安装和配置完成！"
echo ""
echo "常用命令："
echo "  启动应用: pm2 start app.js"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs"
echo "  重启应用: pm2 restart all"
echo "  停止应用: pm2 stop all"