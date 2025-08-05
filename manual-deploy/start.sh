#!/bin/bash
echo "🚀 启动应用..."

# 停止现有服务
pkill -f "node server.js" || true
sleep 2

# 安装依赖
npm install --production

# 启动服务
nohup node server.js > app.log 2>&1 &

# 等待启动
sleep 3

# 检查状态
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ 服务启动失败"
    tail -10 app.log
fi
