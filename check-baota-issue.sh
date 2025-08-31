#!/bin/bash

# 诊断宝塔服务器注册问题
SERVER="47.109.142.72"

echo "======================================"
echo "诊断宝塔服务器注册问题"
echo "======================================"

ssh root@$SERVER << 'DIAGNOSE'

echo "[1] 检查Node服务端口..."
netstat -tlnp | grep -E "3001|3002|3000" || echo "没有Node服务监听"

echo -e "\n[2] 检查Node进程..."
ps aux | grep -E "node.*app.js" | grep -v grep

echo -e "\n[3] 检查.env配置..."
if [ -f /www/wwwroot/learning-platform/server/.env ]; then
    echo "server/.env内容："
    grep -E "PORT|DB_" /www/wwwroot/learning-platform/server/.env
else
    echo "server/.env不存在"
fi

if [ -f /www/wwwroot/learning-platform/.env ]; then
    echo "根目录.env内容："
    grep -E "PORT|DB_" /www/wwwroot/learning-platform/.env
fi

echo -e "\n[4] 查看服务日志（最后20行）..."
if [ -f /var/log/learning-platform.log ]; then
    tail -20 /var/log/learning-platform.log
elif [ -f /www/wwwroot/learning-platform/server/server.log ]; then
    tail -20 /www/wwwroot/learning-platform/server/server.log
else
    echo "没有找到日志文件"
fi

echo -e "\n[5] 测试数据库连接..."
cd /www/wwwroot/learning-platform/server
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Liao0820',
      database: process.env.DB_NAME || 'learning_platform'
    });
    console.log('✅ 数据库连接成功');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('用户总数:', rows[0].count);
    await connection.end();
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
  }
})();
" 2>&1

echo -e "\n[6] 测试注册API..."
TEST_USER="api_test_$(date +%s)"
echo "测试用户: $TEST_USER"

# 尝试不同端口
for PORT in 3002 3001 3000; do
    echo -n "测试端口 $PORT: "
    RESPONSE=$(curl -s -X POST http://localhost:$PORT/api/auth/register \
      -H "Content-Type: application/json" \
      -d "{\"username\": \"$TEST_USER\", \"password\": \"123456\", \"name\": \"API测试\", \"role\": \"user\"}" \
      2>&1)
    
    if echo "$RESPONSE" | grep -q "success"; then
        echo "✅ 成功"
        echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
        
        # 检查数据库
        mysql -u root -pLiao0820 -e "USE learning_platform; SELECT * FROM users WHERE username='$TEST_USER';" 2>/dev/null
        break
    else
        echo "❌ 失败"
    fi
done

echo -e "\n[7] 数据库中的用户列表..."
mysql -u root -pLiao0820 -e "USE learning_platform; SELECT id, username, name, role, created_at FROM users ORDER BY id DESC;" 2>/dev/null

DIAGNOSE

echo ""
echo "======================================"
echo "诊断完成！"
echo "======================================"

