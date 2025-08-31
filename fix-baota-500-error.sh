#!/bin/bash
# 🚨 宝塔服务器500错误紧急修复脚本
# 使用方法: chmod +x fix-baota-500-error.sh && ./fix-baota-500-error.sh

echo "🔧 开始修复宝塔服务器500错误..."
echo "========================================"

# 1. 检查当前服务状态
echo "1️⃣ 检查服务状态:"
echo "Node.js进程:"
ps aux | grep -E "(node|server)" | grep -v grep
echo ""

echo "3002端口占用情况:"
netstat -tlnp | grep :3002 || echo "3002端口未被占用"
echo ""

# 2. 停止所有相关进程
echo "2️⃣ 停止冲突的Node.js进程:"
# 停止PM2进程
if command -v pm2 &> /dev/null; then
    echo "停止PM2进程..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
else
    echo "PM2未安装，跳过PM2清理"
fi

# 强制停止3002端口进程（以及旧的3000端口）
echo "强制停止3002和3000端口进程..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "没有进程占用3002端口"
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "没有进程占用3000端口"

# 停止其他可能的node进程
echo "停止其他Node.js进程..."
pkill -f "server.cjs" 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true
pkill -f "app.js" 2>/dev/null || true

# 等待进程完全停止
sleep 3

# 3. 验证端口释放
echo "3️⃣ 验证端口释放:"
if lsof -ti:3002 >/dev/null 2>&1; then
    echo "❌ 端口3002仍被占用，强制终止..."
    lsof -ti:3002 | xargs kill -9
    sleep 2
else
    echo "✅ 端口3002已释放"
fi

# 4. 检查项目目录和文件
echo "4️⃣ 检查项目文件:"
cd /www/wwwroot/learning-platform || {
    echo "❌ 项目目录不存在，请检查部署路径"
    exit 1
}

[ -f "server.cjs" ] && echo "✅ server.cjs存在" || echo "❌ server.cjs缺失"
[ -f "env.cloud" ] && echo "✅ env.cloud存在" || echo "❌ env.cloud缺失"
[ -d "node_modules" ] && echo "✅ node_modules存在" || echo "❌ node_modules缺失"
[ -d "dist" ] && echo "✅ dist目录存在" || echo "❌ dist目录缺失"

# 5. 重新安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "5️⃣ 重新安装Node.js依赖:"
    npm install --production --force
fi

# 6. 启动Node.js服务
echo "6️⃣ 启动Node.js服务:"
if command -v pm2 &> /dev/null; then
    echo "使用PM2启动服务..."
    pm2 start server.cjs --name "learning-platform" --instances 1 --log /www/wwwlogs/learning-platform-pm2.log
    pm2 save
    pm2 startup
    echo "✅ PM2服务启动完成"
else
    echo "使用nohup启动服务..."
    nohup node server.cjs > /www/wwwlogs/learning-platform.log 2>&1 &
    echo "✅ Node.js服务启动完成"
fi

# 7. 等待服务完全启动
echo "7️⃣ 等待服务启动..."
sleep 5

# 8. 验证服务状态
echo "8️⃣ 验证服务状态:"
if lsof -ti:3002 >/dev/null 2>&1; then
    echo "✅ 3002端口正在监听"
    
    # 测试健康检查
    if curl -s http://127.0.0.1:3002/health >/dev/null; then
        echo "✅ 健康检查通过"
    else
        echo "❌ 健康检查失败"
    fi
    
    # 测试API状态
    if curl -s http://127.0.0.1:3002/api/status >/dev/null; then
        echo "✅ API状态检查通过"
    else
        echo "❌ API状态检查失败"
    fi
else
    echo "❌ 服务启动失败，3002端口未监听"
    echo "查看最近的错误日志:"
    tail -20 /www/wwwlogs/learning-platform.log 2>/dev/null || echo "日志文件不存在"
fi

# 9. 重启Nginx
echo "9️⃣ 重启Nginx服务:"
systemctl reload nginx || service nginx reload
echo "✅ Nginx已重启"

# 10. 最终测试
echo "🔟 最终测试:"
echo "服务器内部测试:"
curl -s http://127.0.0.1:3002/health | head -1 || echo "内部测试失败"

echo ""
echo "========================================"
echo "🎉 修复完成！"
echo "📊 请访问: http://47.109.142.72 测试"
echo "🔍 如还有问题，请查看日志:"
echo "   - PM2日志: pm2 logs"
echo "   - 应用日志: tail -f /www/wwwlogs/learning-platform.log"
echo "   - Nginx日志: tail -f /www/wwwlogs/learning-platform.error.log"
echo "========================================"
