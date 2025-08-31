#!/bin/bash
# 远程修复宝塔服务器500错误脚本
# 从本地执行，无需手动SSH

echo "🔧 开始远程修复宝塔服务器500错误..."
echo "========================================"

# 服务器信息
SERVER_IP="47.109.142.72"
SERVER_USER="root"

# 创建远程修复脚本
echo "📝 创建远程修复脚本..."
cat << 'EOF' > /tmp/remote_fix_500.sh
#!/bin/bash

echo "🔧 在服务器上执行修复..."

# 1. 停止所有相关进程
echo "1️⃣ 停止冲突的Node.js进程:"
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
fi

# 强制停止端口进程
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "server.cjs" 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true
pkill -f "app.js" 2>/dev/null || true

sleep 3

# 2. 进入项目目录
cd /www/wwwroot/learning-platform || exit 1

# 3. 检查并修复权限
echo "2️⃣ 修复文件权限:"
chown -R www:www /www/wwwroot/learning-platform
chmod -R 755 /www/wwwroot/learning-platform

# 4. 检查必要文件
echo "3️⃣ 检查必要文件:"
[ -f "server.cjs" ] && echo "✅ server.cjs存在" || echo "❌ server.cjs缺失"
[ -f "env.cloud" ] && echo "✅ env.cloud存在" || echo "❌ env.cloud缺失"
[ -d "node_modules" ] && echo "✅ node_modules存在" || echo "❌ node_modules缺失"
[ -d "dist" ] && echo "✅ dist目录存在" || echo "❌ dist目录缺失"

# 5. 确保日志目录存在
echo "4️⃣ 创建日志目录:"
mkdir -p /www/wwwlogs
touch /www/wwwlogs/learning-platform.log
touch /www/wwwlogs/learning-platform-pm2.log
chown -R www:www /www/wwwlogs

# 6. 重新安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "5️⃣ 重新安装Node.js依赖:"
    npm install --production --force
fi

# 7. 启动Node.js服务
echo "6️⃣ 启动Node.js服务:"
if command -v pm2 &> /dev/null; then
    echo "使用PM2启动服务..."
    NODE_ENV=production pm2 start server.cjs --name "learning-platform" \
        --instances 1 \
        --log /www/wwwlogs/learning-platform-pm2.log \
        --error /www/wwwlogs/learning-platform-error.log \
        --out /www/wwwlogs/learning-platform-out.log \
        --time
    pm2 save
    pm2 startup
    echo "✅ PM2服务启动完成"
else
    echo "使用nohup启动服务..."
    NODE_ENV=production nohup node server.cjs > /www/wwwlogs/learning-platform.log 2>&1 &
    echo $! > /var/run/learning-platform.pid
    echo "✅ Node.js服务启动完成"
fi

# 8. 等待服务启动
echo "7️⃣ 等待服务启动..."
sleep 5

# 9. 验证服务状态
echo "8️⃣ 验证服务状态:"
if lsof -ti:3002 >/dev/null 2>&1; then
    echo "✅ 3002端口正在监听"
    
    # 测试健康检查
    HEALTH_CHECK=$(curl -s -w "\n%{http_code}" http://127.0.0.1:3002/health 2>/dev/null | tail -1)
    if [ "$HEALTH_CHECK" == "200" ]; then
        echo "✅ 健康检查通过"
    else
        echo "❌ 健康检查失败 (HTTP $HEALTH_CHECK)"
    fi
    
    # 测试API状态
    API_CHECK=$(curl -s -w "\n%{http_code}" http://127.0.0.1:3002/api/status 2>/dev/null | tail -1)
    if [ "$API_CHECK" == "200" ]; then
        echo "✅ API状态检查通过"
    else
        echo "❌ API状态检查失败 (HTTP $API_CHECK)"
    fi
else
    echo "❌ 服务启动失败，3002端口未监听"
    echo "查看最近的错误日志:"
    tail -20 /www/wwwlogs/learning-platform*.log 2>/dev/null || echo "日志文件不存在"
fi

# 10. 重启Nginx
echo "9️⃣ 重启Nginx服务:"
systemctl reload nginx || service nginx reload
echo "✅ Nginx已重启"

# 11. 显示服务状态
echo "🔟 当前服务状态:"
if command -v pm2 &> /dev/null; then
    pm2 status
fi

echo ""
echo "========================================"
echo "✅ 远程修复完成！"
echo "📊 请访问: http://47.109.142.72 测试"
echo "========================================"
EOF

# 复制脚本到服务器并执行
echo "🚀 连接服务器并执行修复..."
scp -o StrictHostKeyChecking=no /tmp/remote_fix_500.sh $SERVER_USER@$SERVER_IP:/tmp/
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "bash /tmp/remote_fix_500.sh"

# 清理临时文件
rm -f /tmp/remote_fix_500.sh

echo ""
echo "🎉 修复脚本执行完成！"
echo "📌 提示："
echo "   - 如果第一次连接需要输入密码"
echo "   - 修复后请访问 http://47.109.142.72 测试登录"
echo "   - 查看日志: ssh root@47.109.142.72 'pm2 logs'"


