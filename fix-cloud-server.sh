#!/bin/bash

echo "🔧 云服务器修复脚本"
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

# 1. 检查本地构建
echo -e "${YELLOW}🔨 检查本地构建...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}📦 构建项目...${NC}"
    npm run build
fi

# 2. 创建部署包
echo -e "${YELLOW}📦 创建部署包...${NC}"
DEPLOY_DIR="cloud-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 复制必要文件
cp -r dist $DEPLOY_DIR/
cp server.js $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp ecosystem.config.js $DEPLOY_DIR/

# 创建云服务器启动脚本
cat > $DEPLOY_DIR/start-cloud.sh << 'EOF'
#!/bin/bash

echo "🚀 启动云服务器应用..."

# 设置环境变量
export PORT=${PORT:-3000}
export NODE_ENV=production

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
echo "🌐 服务器端口: $PORT"
echo "🔧 环境模式: $NODE_ENV"
echo ""

# 后台启动服务器
nohup node server.js > app.log 2>&1 &
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
    exit 1
fi
EOF

chmod +x $DEPLOY_DIR/start-cloud.sh

# 创建防火墙配置脚本
cat > $DEPLOY_DIR/setup-firewall.sh << 'EOF'
#!/bin/bash

echo "🔧 配置防火墙..."

# 检测系统类型
if command -v ufw &> /dev/null; then
    echo "📦 Ubuntu/Debian 系统"
    # Ubuntu/Debian 防火墙配置
    ufw allow 3000/tcp
    ufw allow 22/tcp
    ufw --force enable
    echo "✅ UFW 防火墙配置完成"
elif command -v firewall-cmd &> /dev/null; then
    echo "📦 CentOS/RHEL 系统"
    # CentOS/RHEL 防火墙配置
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --reload
    echo "✅ Firewalld 防火墙配置完成"
else
    echo "⚠️  未检测到防火墙，请手动配置端口 3000"
fi

# 检查端口是否开放
if nc -z localhost 3000 2>/dev/null; then
    echo "✅ 端口 3000 已开放"
else
    echo "❌ 端口 3000 未开放"
fi
EOF

chmod +x $DEPLOY_DIR/setup-firewall.sh

echo -e "${GREEN}✅ 部署包创建成功${NC}"

# 3. 上传到云服务器
echo -e "${YELLOW}📤 上传到云服务器...${NC}"
echo -e "${YELLOW}请输入云服务器密码:${NC}"

# 创建远程目录
ssh $CLOUD_USER@$CLOUD_IP "mkdir -p /root/learning-platform"

# 上传文件
scp -r $DEPLOY_DIR/* $CLOUD_USER@$CLOUD_IP:/root/learning-platform/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 文件上传失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 文件上传成功${NC}"

# 4. 远程配置和启动
echo -e "${YELLOW}🚀 远程配置和启动...${NC}"
ssh $CLOUD_USER@$CLOUD_IP << 'EOF'
cd /root/learning-platform

# 配置防火墙
echo "🔧 配置防火墙..."
./setup-firewall.sh

# 启动应用
echo "🚀 启动应用..."
./start-cloud.sh

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 5
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 外部访问地址: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ 服务启动失败"
    echo "📋 查看日志:"
    tail -20 app.log
fi
EOF

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 云服务器修复完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}🔧 健康检查: http://$CLOUD_IP:3000/health${NC}"
echo -e "${GREEN}📊 API状态: http://$CLOUD_IP:3000/api/status${NC}"
echo -e "${GREEN}================================${NC}"

# 清理本地部署包
rm -rf $DEPLOY_DIR 