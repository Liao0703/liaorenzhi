#!/bin/bash

# 远程服务器重启脚本
# 使用方法: ./restart-remote-server.sh

SERVER_IP="116.62.65.246"
SERVER_USER="root"  # 根据实际情况修改用户名
APP_PATH="/root/learning-platform"  # 根据实际路径修改

echo "🚀 开始重启远程服务器Node.js服务..."
echo "服务器: $SERVER_IP"
echo "用户: $SERVER_USER"
echo "应用路径: $APP_PATH"
echo ""

# 检查SSH连接
echo "1️⃣ 测试SSH连接..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    echo "✅ SSH连接成功"
else
    echo "❌ SSH连接失败，请检查："
    echo "   - 服务器IP是否正确: $SERVER_IP"
    echo "   - 用户名是否正确: $SERVER_USER" 
    echo "   - SSH密钥是否配置正确"
    echo "   - 防火墙是否阻止22端口"
    echo ""
    echo "手动SSH连接命令:"
    echo "ssh $SERVER_USER@$SERVER_IP"
    exit 1
fi

echo ""
echo "2️⃣ 检查当前Node.js进程..."
ssh $SERVER_USER@$SERVER_IP "
    echo '查找Node.js进程:'
    ps aux | grep node | grep -v grep
    echo ''
    echo '查找3000端口占用:'
    netstat -tlnp | grep 3000 || echo '3000端口未被占用'
    echo ''
"

echo "3️⃣ 停止现有服务..."
ssh $SERVER_USER@$SERVER_IP "
    echo '停止PM2服务 (如果存在):'
    pm2 stop all 2>/dev/null || echo 'PM2未运行'
    pm2 delete all 2>/dev/null || echo 'PM2进程已清理'
    
    echo '停止其他Node.js进程:'
    pkill -f 'node.*server' 2>/dev/null || echo '未找到server进程'
    pkill -f 'node.*app' 2>/dev/null || echo '未找到app进程'
    
    echo '等待进程完全停止...'
    sleep 3
"

echo ""
echo "4️⃣ 启动服务..."
ssh $SERVER_USER@$SERVER_IP "
    cd $APP_PATH || { echo '❌ 应用目录不存在: $APP_PATH'; exit 1; }
    
    echo '当前目录:' \$(pwd)
    echo '检查package.json:'
    if [ -f package.json ]; then
        echo '✅ package.json存在'
        echo '可用脚本:'
        npm run 2>/dev/null | grep -E '(start|dev|serve)' || echo '未找到启动脚本'
    else
        echo '❌ package.json不存在'
        exit 1
    fi
    
    echo ''
    echo '检查server.js:'
    if [ -f server.js ]; then
        echo '✅ server.js存在'
    else
        echo '❌ server.js不存在'
    fi
    
    echo ''
    echo '尝试启动服务...'
    
    # 方法1: 使用PM2启动
    if command -v pm2 >/dev/null 2>&1; then
        echo '使用PM2启动服务:'
        if [ -f ecosystem.config.js ]; then
            pm2 start ecosystem.config.js
        else
            pm2 start server.js --name 'learning-platform'
        fi
        pm2 status
    # 方法2: 使用npm start
    elif [ -f package.json ] && npm run | grep -q 'start'; then
        echo '使用npm start启动服务:'
        nohup npm start > /tmp/app.log 2>&1 &
        echo '服务已在后台启动，日志文件: /tmp/app.log'
    # 方法3: 直接使用node
    elif [ -f server.js ]; then
        echo '直接使用node启动server.js:'
        nohup node server.js > /tmp/app.log 2>&1 &
        echo '服务已在后台启动，日志文件: /tmp/app.log'
    else
        echo '❌ 无法找到合适的启动方式'
        exit 1
    fi
    
    echo ''
    echo '等待服务启动...'
    sleep 5
"

echo ""
echo "5️⃣ 验证服务状态..."
ssh $SERVER_USER@$SERVER_IP "
    echo '检查3000端口:'
    if netstat -tlnp | grep 3000; then
        echo '✅ 3000端口已启动'
    else
        echo '❌ 3000端口未启动'
        echo '查看日志:'
        tail -20 /tmp/app.log 2>/dev/null || echo '无日志文件'
    fi
    
    echo ''
    echo '检查Node.js进程:'
    ps aux | grep node | grep -v grep || echo '未找到Node.js进程'
    
    echo ''
    echo 'PM2状态 (如果使用PM2):'
    pm2 status 2>/dev/null || echo 'PM2未使用'
"

echo ""
echo "6️⃣ 测试API连接..."
sleep 2
if curl -s -I http://$SERVER_IP:3000/ --connect-timeout 10 | head -1; then
    echo "✅ API服务响应正常!"
else
    echo "❌ API服务仍无响应"
    echo "尝试查看详细错误..."
    ssh $SERVER_USER@$SERVER_IP "
        echo '最新日志:'
        tail -50 /tmp/app.log 2>/dev/null || echo '无日志可查看'
        
        echo ''
        echo '检查依赖是否安装:'
        cd $APP_PATH && npm list --depth=0 2>/dev/null | head -10
    "
fi

echo ""
echo "🎉 重启脚本执行完成!"
echo ""
echo "📋 后续操作建议:"
echo "1. 访问前端: http://$SERVER_IP/"
echo "2. 测试API: http://$SERVER_IP:3000/"
echo "3. 查看日志: ssh $SERVER_USER@$SERVER_IP 'tail -f /tmp/app.log'"
echo "4. PM2监控: ssh $SERVER_USER@$SERVER_IP 'pm2 monit'" 