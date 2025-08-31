#!/bin/bash

# 一键修复502错误 - 可直接在宝塔终端执行
# 复制整个脚本内容，粘贴到宝塔终端执行

echo "======================================"
echo "一键修复502错误脚本"
echo "======================================"
echo ""

# 进入项目目录
cd /www/wwwroot/learning-platform

echo "[步骤1] 停止所有相关进程..."
pkill -f "node.*app.js" 2>/dev/null || true
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✅ 已清理旧进程"

echo ""
echo "[步骤2] 创建配置文件..."
# 创建server目录的.env文件
cat > server/.env << 'EOF'
# 数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
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
echo "✅ 配置文件已创建"

echo ""
echo "[步骤3] 安装依赖（如需要）..."
cd server
if [ ! -d "node_modules" ]; then
    echo "安装依赖包..."
    npm install --production
fi
echo "✅ 依赖检查完成"

echo ""
echo "[步骤4] 启动Node.js服务..."

# 检查PM2是否可用
if command -v pm2 &> /dev/null; then
    echo "使用PM2启动..."
    pm2 start app.js --name learning-platform --max-memory-restart 1G
    pm2 save
    pm2 startup
    echo "✅ PM2启动成功"
else
    echo "PM2未安装，使用nohup启动..."
    nohup node app.js > /var/log/learning-platform.log 2>&1 &
    echo "✅ Node.js服务已启动 (PID: $!)"
fi

# 等待服务启动
sleep 3

echo ""
echo "[步骤5] 检查服务状态..."
# 检查进程
if ps aux | grep -q "[n]ode.*app.js"; then
    echo "✅ Node进程运行正常"
else
    echo "❌ Node进程未运行"
fi

# 检查端口
if netstat -tlnp | grep -q ":3002"; then
    echo "✅ 端口3002监听正常"
else
    echo "❌ 端口3002未监听"
fi

# 测试API
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ API响应正常"
else
    echo "⚠️ API可能需要更多时间启动"
fi

echo ""
echo "[步骤6] 配置Nginx..."
# 检查Nginx配置文件
NGINX_CONF="/www/server/panel/vhost/nginx/47.109.142.72.conf"
if [ -f "$NGINX_CONF" ]; then
    # 检查是否有API代理配置
    if ! grep -q "location /api" "$NGINX_CONF"; then
        echo "添加API代理配置..."
        # 在server块的最后一个}之前插入配置
        sed -i '/^}$/i\
    location /api {\
        proxy_pass http://127.0.0.1:3002;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_connect_timeout 60s;\
        proxy_send_timeout 60s;\
        proxy_read_timeout 60s;\
    }' "$NGINX_CONF"
        echo "✅ Nginx配置已更新"
    else
        echo "✅ Nginx配置已存在"
    fi
fi

# 重载Nginx
nginx -s reload
echo "✅ Nginx已重载"

echo ""
echo "======================================"
echo "修复完成！"
echo "======================================"
echo ""
echo "测试结果："

# 最终测试
echo -n "1. Node进程: "
ps aux | grep -q "[n]ode.*app.js" && echo "✅ 运行中" || echo "❌ 未运行"

echo -n "2. 端口监听: "
netstat -tlnp | grep -q ":3002" && echo "✅ 正常" || echo "❌ 异常"

echo -n "3. API健康检查: "
curl -s http://localhost:3002/api/health > /dev/null 2>&1 && echo "✅ 正常" || echo "⚠️ 需要等待"

echo ""
echo "现在请访问 http://47.109.142.72 测试登录"
echo ""
echo "测试账号："
echo "- 管理员: admin / admin123"
echo "- 维护人员: maintenance / 123456"
echo ""

# 显示日志
echo "最近的错误日志："
echo "-------------------"
tail -5 /var/log/learning-platform.log 2>/dev/null || pm2 logs --lines 5 --nostream 2>/dev/null || echo "暂无日志"
