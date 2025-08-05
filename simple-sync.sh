#!/bin/bash

echo "🔄 简单同步到云服务器"
echo "=================="

CLOUD_IP="116.62.65.246"
CLOUD_USER="root"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 目标服务器: $CLOUD_IP${NC}"

# 1. 构建项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build

# 2. 创建临时同步目录
TEMP_DIR="temp-sync"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# 复制文件
cp -r dist $TEMP_DIR/
cp server.js $TEMP_DIR/
cp package.json $TEMP_DIR/

# 3. 提示用户输入密码
echo -e "${YELLOW}🔐 请输入云服务器密码:${NC}"
read -s CLOUD_PASSWORD

# 4. 设置环境变量
export SSHPASS="$CLOUD_PASSWORD"

# 5. 上传文件
echo -e "${YELLOW}📤 上传文件...${NC}"
sshpass -e scp -r $TEMP_DIR/* $CLOUD_USER@$CLOUD_IP:/root/learning-platform/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 文件上传失败${NC}"
    rm -rf $TEMP_DIR
    exit 1
fi

echo -e "${GREEN}✅ 文件上传成功${NC}"

# 6. 远程启动
echo -e "${YELLOW}🚀 远程启动服务...${NC}"

sshpass -e ssh $CLOUD_USER@$CLOUD_IP << 'EOF'
cd /root/learning-platform

# 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "node server.js" || true
sleep 2

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 启动服务
echo "🚀 启动服务..."
nohup node server.js > app.log 2>&1 &

# 等待启动
sleep 3

# 检查状态
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 同步成功！服务已启动"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me):3000"
    echo "🔧 健康检查: http://$(curl -s ifconfig.me):3000/health"
else
    echo "❌ 同步失败"
    echo "📋 查看日志:"
    tail -10 app.log
fi
EOF

# 清理
rm -rf $TEMP_DIR

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 同步完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}🔧 健康检查: http://$CLOUD_IP:3000/health${NC}"
echo -e "${GREEN}================================${NC}"

# 7. 验证同步结果
echo -e "${YELLOW}🔍 验证同步结果...${NC}"
sleep 3
./check-cloud-status.sh 