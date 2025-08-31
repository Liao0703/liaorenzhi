#!/bin/bash

# 快速诊断网站空白问题
echo "🔍 快速诊断 47.109.142.72 网站问题"
echo "================================"

SERVER="root@47.109.142.72"

# 1. 测试基本连接
echo ""
echo "1️⃣ 测试网站响应..."
curl -I http://47.109.142.72 2>&1 | head -20

# 2. 检查服务器上的文件
echo ""
echo "2️⃣ 检查服务器文件..."
ssh $SERVER "
echo '📁 检查网站目录：'
if [ -d '/www/wwwroot/learning-platform' ]; then
    echo '✓ /www/wwwroot/learning-platform 存在'
    ls -la /www/wwwroot/learning-platform/dist/ 2>/dev/null | head -10
elif [ -d '/www/wwwroot/47.109.142.72' ]; then
    echo '✓ /www/wwwroot/47.109.142.72 存在'
    ls -la /www/wwwroot/47.109.142.72/ | head -10
else
    echo '❌ 未找到网站目录'
fi

echo ''
echo '📝 检查Nginx配置：'
if [ -f '/www/server/panel/vhost/nginx/47.109.142.72.conf' ]; then
    echo '✓ Nginx配置存在'
    grep -E 'root|location|proxy_pass' /www/server/panel/vhost/nginx/47.109.142.72.conf | head -20
else
    echo '❌ Nginx配置不存在'
fi

echo ''
echo '🔧 检查服务状态：'
# 检查nginx
if systemctl is-active nginx &>/dev/null || service nginx status &>/dev/null; then
    echo '✓ Nginx运行中'
else
    echo '❌ Nginx未运行'
fi

# 检查端口
echo ''
echo '🔌 端口监听状态：'
netstat -tlnp | grep -E ':80|:3001|:3002' || ss -tlnp | grep -E ':80|:3001|:3002'

# 检查PM2
echo ''
echo '📊 PM2进程状态：'
if command -v pm2 &>/dev/null; then
    pm2 list
else
    echo '❌ PM2未安装'
fi
"

# 3. 检查错误日志
echo ""
echo "3️⃣ 最近的错误日志..."
ssh $SERVER "
if [ -f '/www/wwwlogs/47.109.142.72.error.log' ]; then
    echo '📋 Nginx错误日志：'
    tail -10 /www/wwwlogs/47.109.142.72.error.log
fi
"

echo ""
echo "🔍 诊断完成！"
echo ""
echo "📌 可能的问题："
echo "1. 如果看到 'Connection refused' - 服务器可能未启动或防火墙阻止"
echo "2. 如果dist目录为空 - 前端未编译部署"
echo "3. 如果配置文件路径错误 - 需要修正Nginx配置"
echo "4. 如果PM2进程未运行 - 后端服务未启动"
echo ""
echo "💡 运行修复脚本: ./fix-blank-page.sh"




