#!/bin/bash

# 部署到阿里云服务器的脚本
# 使用前请确保已配置SSH密钥访问

SERVER_IP="116.62.65.246"
SERVER_USER="root"  # 或者你的用户名
REMOTE_DIR="/opt/learning-platform"

echo "🚀 开始部署到云服务器..."

# 检查SSH连接
echo "🔍 测试SSH连接..."
if ! ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'SSH连接成功'" 2>/dev/null; then
    echo "❌ SSH连接失败，请检查："
    echo "   1. 服务器IP地址是否正确"
    echo "   2. SSH密钥是否配置正确"
    echo "   3. 服务器安全组是否开放22端口"
    exit 1
fi

# 在服务器上创建目录
echo "📁 创建远程目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# 上传server目录
echo "📤 上传服务器文件..."
rsync -avz --delete server/ $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# 在服务器上安装依赖和启动服务
echo "🛠️  在服务器上设置环境..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/learning-platform

# 检查Node.js版本
if command -v node &> /dev/null; then
    echo "✅ Node.js 版本: $(node --version)"
else
    echo "❌ Node.js 未安装，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 创建必要目录
mkdir -p uploads

# 设置环境变量文件
cat > .env << 'ENVEOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=railway-learning-platform-super-secret-jwt-key-2024
CORS_ORIGIN=http://116.62.65.246:3000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
ENVEOF

# 停止可能运行的旧服务
pkill -f "node.*app.js" 2>/dev/null || true

# 启动服务
echo "🎯 启动后端服务..."
nohup node app.js > server.log 2>&1 &

# 等待服务启动
sleep 3

# 检查服务状态
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 API地址: http://116.62.65.246:3001"
    echo "🔍 健康检查: http://116.62.65.246:3001/health"
else
    echo "❌ 服务启动失败，请检查日志："
    tail -20 server.log
fi
EOF

echo "🎉 部署完成！"
echo "🌐 您的API服务地址: http://116.62.65.246:3001"
echo "🔍 健康检查: http://116.62.65.246:3001/health"