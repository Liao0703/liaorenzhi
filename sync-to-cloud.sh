#!/bin/bash

echo "🔄 本地到云服务器同步"
echo "=================="

# 云服务器信息
CLOUD_IP="116.62.65.246"
CLOUD_USER="root"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 目标服务器: $CLOUD_IP${NC}"
echo -e "${BLUE}📁 本地目录: $(pwd)${NC}"

# 1. 检查本地构建
echo -e "${YELLOW}🔨 检查本地构建...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}📦 构建项目...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ 本地构建完成${NC}"

# 2. 创建同步包
echo -e "${YELLOW}📦 创建同步包...${NC}"
SYNC_DIR="sync-package"
rm -rf $SYNC_DIR
mkdir -p $SYNC_DIR

# 复制必要文件
echo "📋 复制文件..."
cp -r dist $SYNC_DIR/
cp server.cjs $SYNC_DIR/
cp package.json $SYNC_DIR/
cp ecosystem.config.js $SYNC_DIR/

# 创建同步启动脚本
cat > $SYNC_DIR/sync-start.sh << 'EOF'
#!/bin/bash

echo "🔄 同步启动脚本"
echo "=============="

# 设置环境变量
export PORT=${PORT:-3000}
export NODE_ENV=production

# 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "node server.cjs" || true
sleep 2

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 检查端口占用
echo "🔍 检查端口占用..."
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，正在停止占用进程..."
    lsof -ti:$PORT | xargs kill -9
    sleep 2
fi

# 启动服务器
echo "🚀 启动服务器..."
echo "🌐 服务器端口: $PORT"
echo "🔧 环境模式: $NODE_ENV"
echo ""

# 后台启动服务器
nohup node server.cjs > app.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 检查服务器是否启动成功
if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "✅ 服务器启动成功！"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me):$PORT"
    echo "🔧 健康检查: http://$(curl -s ifconfig.me):$PORT/health"
    echo "📊 API状态: http://$(curl -s ifconfig.me):$PORT/api/status"
    echo "📋 进程ID: $SERVER_PID"
    echo "📄 日志文件: app.log"
else
    echo "❌ 服务器启动失败"
    echo "📋 查看日志:"
    tail -10 app.log
    exit 1
fi
EOF

chmod +x $SYNC_DIR/sync-start.sh

echo -e "${GREEN}✅ 同步包创建成功${NC}"

# 3. 上传到云服务器
echo -e "${YELLOW}📤 上传到云服务器...${NC}"
echo -e "${YELLOW}请输入云服务器密码:${NC}"

# 创建远程目录
ssh $CLOUD_USER@$CLOUD_IP "mkdir -p /root/learning-platform"

# 上传文件
scp -r $SYNC_DIR/* $CLOUD_USER@$CLOUD_IP:/root/learning-platform/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 文件上传失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 文件上传成功${NC}"

# 4. 远程启动
echo -e "${YELLOW}🚀 远程启动服务...${NC}"
ssh $CLOUD_USER@$CLOUD_IP << 'EOF'
cd /root/learning-platform

# 执行同步启动脚本
./sync-start.sh

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 2
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 同步完成！服务正常运行"
    echo "🌐 外部访问地址: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ 同步失败，服务未启动"
    echo "📋 查看日志:"
    tail -20 app.log
fi
EOF

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 同步完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}🔧 健康检查: http://$CLOUD_IP:3000/health${NC}"
echo -e "${GREEN}📊 API状态: http://$CLOUD_IP:3000/api/status${NC}"
echo -e "${GREEN}================================${NC}"

# 清理本地同步包
rm -rf $SYNC_DIR

# 5. 验证同步结果
echo -e "${YELLOW}🔍 验证同步结果...${NC}"
sleep 3
./check-cloud-status.sh 