#!/bin/bash
# 🔍 宝塔服务器诊断脚本

echo "🔍 宝塔服务器详细诊断开始..."
echo "========================================"

# 系统信息
echo "📊 系统信息:"
echo "服务器时间: $(date)"
echo "系统版本: $(cat /etc/os-release | grep PRETTY_NAME)"
echo "Node.js版本: $(node --version 2>/dev/null || echo '未安装')"
echo "NPM版本: $(npm --version 2>/dev/null || echo '未安装')"
echo "PM2版本: $(pm2 --version 2>/dev/null || echo '未安装')"
echo ""

# 进程状态
echo "🔄 进程状态:"
echo "所有Node.js进程:"
ps aux | grep -E "(node|pm2)" | grep -v grep | head -10
echo ""

echo "端口占用情况:"
netstat -tlnp | grep -E ":(3002|3000|80|443)" | head -10
echo ""

# 项目文件检查
echo "📁 项目文件检查:"
if [ -d "/www/wwwroot/learning-platform" ]; then
    cd /www/wwwroot/learning-platform
    echo "✅ 项目目录存在: $(pwd)"
    
    echo "关键文件状态:"
    ls -la | grep -E "(server\.cjs|env\.cloud|package\.json|dist)" | awk '{print $9 ": " $5 " bytes, " $6 " " $7 " " $8}'
    
    echo "目录大小:"
    du -sh * 2>/dev/null | head -5
else
    echo "❌ 项目目录 /www/wwwroot/learning-platform 不存在"
fi
echo ""

# 环境变量检查
echo "🌍 环境变量检查:"
if [ -f "/www/wwwroot/learning-platform/env.cloud" ]; then
    echo "✅ env.cloud存在，内容预览:"
    head -5 /www/wwwroot/learning-platform/env.cloud | sed 's/PASSWORD=.*/PASSWORD=***hidden***/'
else
    echo "❌ env.cloud文件缺失"
fi
echo ""

# PM2状态
echo "📊 PM2状态:"
if command -v pm2 &> /dev/null; then
    pm2 status 2>/dev/null || echo "PM2无活动进程"
    echo "PM2日志摘要:"
    pm2 logs --lines 5 2>/dev/null || echo "无PM2日志"
else
    echo "PM2未安装"
fi
echo ""

# Nginx状态
echo "🌐 Nginx状态:"
systemctl status nginx --no-pager -l | head -10
echo ""

echo "Nginx配置文件:"
if [ -f "/www/server/panel/vhost/nginx/learning-platform.conf" ]; then
    echo "✅ 站点配置存在"
    grep -A 5 -B 5 "proxy_pass" /www/server/panel/vhost/nginx/learning-platform.conf 2>/dev/null || echo "无代理配置"
else
    echo "❌ 找不到Nginx配置文件"
fi
echo ""

# 日志文件检查
echo "📝 日志文件检查:"
if [ -f "/www/wwwlogs/learning-platform.error.log" ]; then
    echo "最近的Nginx错误日志:"
    tail -5 /www/wwwlogs/learning-platform.error.log 2>/dev/null
else
    echo "Nginx错误日志不存在"
fi

if [ -f "/www/wwwlogs/learning-platform.log" ]; then
    echo "最近的应用日志:"
    tail -5 /www/wwwlogs/learning-platform.log 2>/dev/null  
else
    echo "应用日志不存在"
fi
echo ""

# 网络连通性测试
echo "🔗 网络连通性测试:"
curl -s -o /dev/null -w "内部API测试 - 状态码: %{http_code}, 响应时间: %{time_total}s\n" http://127.0.0.1:3002/health 2>/dev/null || echo "内部API测试失败"

# 磁盘空间
echo "💾 磁盘空间:"
df -h | head -5

echo "========================================"
echo "🔍 诊断完成！"
echo "========================================"
