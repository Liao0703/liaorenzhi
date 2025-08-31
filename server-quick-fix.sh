#!/bin/bash
# 服务器上直接执行的快速修复脚本

echo "🔧 开始修复500错误..."

# 1. 检查Node.js是否安装
echo "1️⃣ 检查Node.js版本："
node --version || echo "❌ Node.js未安装"

# 2. 停止可能运行的进程
echo "2️⃣ 停止现有进程..."
# 查找并停止占用3002端口的进程
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "端口3002未被占用"
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "端口3000未被占用"

# 停止可能的node进程
pkill -f "server.cjs" 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

sleep 2

# 3. 检查项目文件
echo "3️⃣ 检查项目文件："
[ -f "server.cjs" ] && echo "✅ server.cjs 存在" || echo "❌ server.cjs 缺失"
[ -f "env.cloud" ] && echo "✅ env.cloud 存在" || echo "❌ env.cloud 缺失"
[ -d "node_modules" ] && echo "✅ node_modules 存在" || echo "❌ node_modules 缺失"
[ -d "dist" ] && echo "✅ dist 目录存在" || echo "❌ dist 目录缺失"

# 4. 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "4️⃣ 安装依赖..."
    npm install --production
fi

# 5. 使用nohup启动服务（不依赖PM2）
echo "5️⃣ 启动Node.js服务..."
# 先创建日志目录
mkdir -p /www/wwwlogs

# 使用nohup后台启动
NODE_ENV=production nohup node server.cjs > /www/wwwlogs/learning-platform.log 2>&1 &
echo $! > /var/run/learning-platform.pid
echo "✅ 服务已启动，PID: $(cat /var/run/learning-platform.pid)"

# 6. 等待服务启动
echo "6️⃣ 等待服务启动..."
sleep 5

# 7. 验证服务
echo "7️⃣ 验证服务状态："
if lsof -ti:3002 >/dev/null 2>&1; then
    echo "✅ 端口3002正在监听"
    
    # 测试健康检查
    echo "测试健康检查："
    curl -s http://127.0.0.1:3002/health | head -20 || echo "健康检查失败"
    
    echo ""
    echo "测试API状态："
    curl -s http://127.0.0.1:3002/api/status | head -20 || echo "API检查失败"
else
    echo "❌ 服务启动失败"
    echo "查看日志："
    tail -20 /www/wwwlogs/learning-platform.log
fi

# 8. 重启Nginx
echo ""
echo "8️⃣ 重启Nginx..."
systemctl reload nginx || service nginx reload || /etc/init.d/nginx reload

echo ""
echo "========================================"
echo "✅ 修复完成！"
echo "📊 请访问: http://47.109.142.72 测试"
echo "📝 查看日志: tail -f /www/wwwlogs/learning-platform.log"
echo "🔍 停止服务: kill $(cat /var/run/learning-platform.pid 2>/dev/null)"
echo "========================================"


