#!/bin/bash

echo "🚀 开始内网部署..."

# 检查参数
if [ $# -eq 0 ]; then
    echo "使用方法: $0 <服务器IP> [用户名] [端口]"
    echo "示例: $0 192.168.1.100 admin 22"
    exit 1
fi

SERVER_IP=$1
USER=${2:-$USER}
PORT=${3:-22}
REMOTE_DIR="/var/www/learning-platform"

echo "服务器: $SERVER_IP"
echo "用户: $USER"
echo "端口: $PORT"
echo "远程目录: $REMOTE_DIR"

# 构建项目
echo "📦 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

# 创建部署包
echo "📦 创建部署包..."
tar -czf learning-platform.tar.gz dist/ server.js package.json package-lock.json

# 上传到服务器
echo "📤 上传到服务器..."
scp -P $PORT learning-platform.tar.gz $USER@$SERVER_IP:/tmp/

if [ $? -ne 0 ]; then
    echo "❌ 上传失败！请检查网络连接和服务器配置。"
    exit 1
fi

# 在服务器上部署
echo "🔧 在服务器上部署..."
ssh -p $PORT $USER@$SERVER_IP << EOF
    echo "停止现有服务..."
    sudo pm2 stop learning-platform 2>/dev/null || true
    
    echo "创建目录..."
    sudo mkdir -p $REMOTE_DIR
    cd $REMOTE_DIR
    
    echo "清理旧文件..."
    sudo rm -rf *
    
    echo "解压部署包..."
    sudo tar -xzf /tmp/learning-platform.tar.gz
    
    echo "安装依赖..."
    sudo npm install --production
    
    echo "启动服务..."
    sudo pm2 start server.js --name learning-platform
    
    echo "设置开机自启..."
    sudo pm2 save
    sudo pm2 startup 2>/dev/null || true
    
    echo "清理临时文件..."
    sudo rm /tmp/learning-platform.tar.gz
    
    echo "检查服务状态..."
    sudo pm2 status
EOF

if [ $? -eq 0 ]; then
    echo "✅ 部署完成！"
    echo "🌐 访问地址: http://$SERVER_IP:3000"
    echo "📊 查看状态: ssh $USER@$SERVER_IP 'sudo pm2 status'"
    echo "📋 查看日志: ssh $USER@$SERVER_IP 'sudo pm2 logs learning-platform'"
else
    echo "❌ 部署失败！请检查服务器配置。"
    exit 1
fi

# 清理本地文件
rm learning-platform.tar.gz

echo "🎉 内网部署完成！" 