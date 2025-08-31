#!/bin/bash

# 修复端口配置为3002
SERVER="47.109.142.72"

echo "======================================"
echo "修复端口配置为3002"
echo "服务器: $SERVER"
echo "======================================"

ssh root@$SERVER << 'REMOTE_FIX'

# 设置正确的项目路径
PROJECT_PATH="/www/wwwroot/learning-platform"

echo "[1] 更新.env文件端口配置..."

# 更新server目录的.env
if [ -d "$PROJECT_PATH/server" ]; then
    cat > "$PROJECT_PATH/server/.env" << 'EOF'
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# 服务器配置
PORT=3002
NODE_ENV=production

# JWT配置
JWT_SECRET=your-secret-key-here-change-in-production

# CORS配置
CORS_ORIGIN=http://47.109.142.72,http://localhost:5173
EOF
    echo "✅ server/.env 已更新为端口3002"
fi

# 也更新根目录的.env（如果存在）
if [ -f "$PROJECT_PATH/.env" ]; then
    sed -i 's/PORT=3001/PORT=3002/g' "$PROJECT_PATH/.env"
    echo "✅ 根目录.env 已更新"
fi

echo -e "\n[2] 停止所有Node进程..."
# 停止所有相关进程
pkill -f "node.*app.js" 2>/dev/null || true
pm2 stop all 2>/dev/null || true

echo -e "\n[3] 重新启动服务（端口3002）..."
cd "$PROJECT_PATH/server"

# 使用nohup启动，确保使用3002端口
PORT=3002 nohup node app.js > /var/log/learning-platform.log 2>&1 &
echo "✅ 服务已启动，PID: $!"

# 等待服务启动
sleep 3

echo -e "\n[4] 检查端口监听..."
netstat -tlnp | grep 3002 || echo "端口3002未监听"
lsof -i :3002 || echo "没有进程监听3002"

echo -e "\n[5] 检查服务进程..."
ps aux | grep -E "node.*app.js" | grep -v grep

echo -e "\n[6] 测试API连接..."
curl -s http://localhost:3002/api/health || curl -s http://localhost:3002/health || echo "API测试失败"

echo -e "\n[7] 查看最近日志..."
tail -10 /var/log/learning-platform.log 2>/dev/null || echo "无日志文件"

echo -e "\n[8] 测试注册功能..."
TEST_USER="port_test_$(date +%s)"
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USER\", \"password\": \"123456\", \"name\": \"端口测试用户\", \"role\": \"user\"}" \
  -s | head -100

echo -e "\n[9] 验证数据库..."
mysql -u root -pLiao0820 -e "USE learning_platform; SELECT id, username, name, role FROM users ORDER BY id DESC LIMIT 3;" 2>/dev/null

REMOTE_FIX

echo ""
echo "======================================"
echo "端口修复完成！"
echo "======================================"
echo ""
echo "请检查："
echo "1. 访问 http://$SERVER:3002/api/health 测试API"
echo "2. 访问 http://$SERVER 测试前端"
echo "3. 在前端注册新用户"
echo "4. 访问 http://$SERVER/phpmyadmin 查看数据库"

