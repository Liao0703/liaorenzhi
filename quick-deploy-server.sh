#!/bin/bash

# 快速部署服务器代码到云服务器
SERVER_IP="116.62.65.246"
SERVER_USER="root"
REMOTE_DIR="/opt/learning-platform"

echo "🚀 快速部署后端服务到云服务器..."

# 1. 上传server目录
echo "📤 上传服务器文件..."
scp -r server/ $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# 2. 在服务器上执行启动命令
echo "🛠️  在服务器上启动服务..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/learning-platform

# 安装依赖
npm install

# 创建正确的环境配置
cat > .env << 'ENVEOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=railway-learning-platform-super-secret-jwt-key-2024
CORS_ORIGIN=http://116.62.65.246:3000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
ENVEOF

# 创建uploads目录
mkdir -p uploads

# 停止旧服务
pkill -f "node.*app.js" 2>/dev/null || true

# 启动新服务
echo "🎯 启动服务..."
nohup node app.js > server.log 2>&1 &

# 等待启动
sleep 3

# 测试服务
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 API地址: http://116.62.65.246:3001"
    echo "🔍 健康检查: http://116.62.65.246:3001/health"
    
    # 显示服务状态
    echo "📊 服务状态:"
    ps aux | grep "node.*app.js" | grep -v grep
    netstat -tlnp | grep 3001
else
    echo "❌ 服务启动失败"
    echo "📋 查看日志:"
    tail -10 server.log
fi
EOF

echo "🎉 部署完成！"
echo ""
echo "🔗 测试链接："
echo "   健康检查: http://116.62.65.246:3001/health"
echo "   API基础: http://116.62.65.246:3001/api"