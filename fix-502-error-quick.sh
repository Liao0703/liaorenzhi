#!/bin/bash

# 快速修复502错误脚本
echo "======================================"
echo "快速修复502错误"
echo "服务器: 47.109.142.72"
echo "======================================"
echo ""

SERVER="47.109.142.72"

# 使用密码连接（如果需要）
echo "请输入服务器密码进行修复："

ssh root@$SERVER << 'REMOTE_FIX'

echo "[1] 检查Node.js进程状态..."
echo "----------------------------------------"
ps aux | grep -E "node|pm2" | grep -v grep || echo "❌ 没有Node进程在运行"

echo ""
echo "[2] 检查端口监听状态..."
echo "----------------------------------------"
netstat -tlnp | grep -E "3001|3002" || echo "❌ 端口3001/3002未监听"
lsof -i :3002 || echo "❌ 3002端口无进程"

echo ""
echo "[3] 检查PM2状态..."
echo "----------------------------------------"
pm2 list 2>/dev/null || echo "❌ PM2未运行或未安装"

echo ""
echo "[4] 启动后端服务..."
echo "----------------------------------------"
cd /www/wwwroot/learning-platform

# 方法1: 尝试使用PM2启动
if command -v pm2 &> /dev/null; then
    echo "使用PM2启动服务..."
    pm2 stop all 2>/dev/null
    pm2 delete all 2>/dev/null
    
    # 检查是否有ecosystem配置文件
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env production
    elif [ -f "server/app.js" ]; then
        cd server
        pm2 start app.js --name learning-platform
    else
        echo "❌ 找不到启动文件"
    fi
    
    pm2 save
    pm2 startup
else
    echo "PM2未安装，使用直接启动方式..."
    
    # 方法2: 直接启动Node
    cd /www/wwwroot/learning-platform/server
    
    # 杀死旧进程
    pkill -f "node.*app.js" 2>/dev/null || true
    
    # 创建.env文件（如果不存在）
    if [ ! -f .env ]; then
        cat > .env << 'ENV'
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
ENV
        echo "✅ .env文件已创建"
    fi
    
    # 启动服务
    nohup node app.js > /var/log/learning-platform.log 2>&1 &
    echo "✅ Node服务已启动，PID: $!"
fi

# 等待服务启动
sleep 3

echo ""
echo "[5] 验证服务状态..."
echo "----------------------------------------"
# 检查进程
ps aux | grep -E "node.*app.js|pm2" | grep -v grep

# 检查端口
netstat -tlnp | grep 3002

# 测试API
curl -s http://localhost:3002/api/health || curl -s http://localhost:3002/health || echo "API健康检查失败"

echo ""
echo "[6] 检查Nginx配置..."
echo "----------------------------------------"
# 检查Nginx配置
nginx -t 2>&1

# 检查站点配置
if [ -f /www/server/panel/vhost/nginx/47.109.142.72.conf ]; then
    echo "Nginx站点配置:"
    grep -E "proxy_pass|location /api" /www/server/panel/vhost/nginx/47.109.142.72.conf
else
    echo "检查默认Nginx配置:"
    ls -la /www/server/panel/vhost/nginx/
fi

echo ""
echo "[7] 重启Nginx..."
echo "----------------------------------------"
nginx -s reload
echo "✅ Nginx已重启"

echo ""
echo "[8] 查看错误日志..."
echo "----------------------------------------"
echo "=== 最近的Node.js日志 ==="
tail -20 /var/log/learning-platform.log 2>/dev/null || echo "无日志文件"

echo ""
echo "=== 最近的PM2日志 ==="
pm2 logs --lines 10 --nostream 2>/dev/null || echo "无PM2日志"

echo ""
echo "=== Nginx错误日志 ==="
tail -10 /www/wwwlogs/47.109.142.72.error.log 2>/dev/null || tail -10 /var/log/nginx/error.log 2>/dev/null || echo "无Nginx错误日志"

REMOTE_FIX

echo ""
echo "======================================"
echo "修复完成！"
echo "======================================"
echo ""
echo "请检查："
echo "1. 访问 http://47.109.142.72 测试登录"
echo "2. 如果还是502，查看上面的错误日志"
echo ""
echo "常见问题解决："
echo "- 如果是数据库连接失败：检查RDS配置"
echo "- 如果是端口冲突：修改PORT配置"
echo "- 如果是权限问题：检查文件权限"
