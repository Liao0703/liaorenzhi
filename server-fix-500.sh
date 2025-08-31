#!/bin/bash
# 直接在服务器上执行的修复脚本

echo "🔧 修复500错误..."

# 进入项目目录
cd /www/wwwroot/learning-platform || exit 1

# 停止所有进程
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 等待
sleep 2

# 启动服务
NODE_ENV=production pm2 start server.cjs --name "learning-platform" --instances 1
pm2 save

# 重启nginx
systemctl reload nginx

# 显示状态
echo "✅ 修复完成！当前状态："
pm2 status
echo ""
echo "测试健康检查："
curl -s http://127.0.0.1:3002/health | python3 -m json.tool || echo "健康检查失败"


