#!/bin/bash

# 🚀 同步网站脚本到宝塔文件管理
# 适用于宝塔面板环境的学习平台

echo "🔄 同步网站脚本到宝塔服务器"
echo "====================================="

# 服务器信息
SERVER_IP="116.62.65.246"
SERVER_USER="root"
BAOTA_PROJECT_DIR="/www/wwwroot/learning-platform"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 目标服务器: $SERVER_IP${NC}"
echo -e "${BLUE}📁 宝塔项目目录: $BAOTA_PROJECT_DIR${NC}"
echo -e "${BLUE}🔧 本地目录: $(pwd)${NC}"

# 检查连接
echo -e "${YELLOW}🔍 检查服务器连接...${NC}"
if ! ping -c 1 $SERVER_IP > /dev/null 2>&1; then
    echo -e "${RED}❌ 无法连接到服务器 $SERVER_IP${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 服务器连接正常${NC}"

# 询问是否继续
echo ""
read -p "确认同步到宝塔服务器? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消同步"
    exit 1
fi

# 1. 构建前端（如果需要）
echo -e "${YELLOW}🔨 检查前端构建...${NC}"
if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
    echo -e "${YELLOW}📦 重新构建前端...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 前端构建失败${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ 前端已准备就绪${NC}"

# 2. 创建同步包
echo -e "${YELLOW}📦 创建同步包...${NC}"
SYNC_DIR="baota-sync-$(date +%Y%m%d_%H%M%S)"
mkdir -p $SYNC_DIR

# 复制核心文件
echo "📋 复制核心文件..."
cp -r dist $SYNC_DIR/ 2>/dev/null || echo "⚠️  dist目录不存在，跳过"
cp server.cjs $SYNC_DIR/ 2>/dev/null || echo "⚠️  server.cjs不存在"
cp package.json $SYNC_DIR/ 2>/dev/null || echo "⚠️  package.json不存在"
cp register.html $SYNC_DIR/ 2>/dev/null || echo "⚠️  register.html不存在"

# 复制服务器端代码（如果存在）
if [ -d "server" ]; then
    echo "📋 复制服务器端代码..."
    cp -r server $SYNC_DIR/
fi

# 复制配置文件
if [ -f "ecosystem.config.js" ]; then
    cp ecosystem.config.js $SYNC_DIR/
fi

# 复制部署脚本
echo "📋 复制部署脚本..."
cp deploy-to-baota.sh $SYNC_DIR/ 2>/dev/null || echo "⚠️  deploy-to-baota.sh不存在"
cp nginx-baota.conf $SYNC_DIR/ 2>/dev/null || echo "⚠️  nginx-baota.conf不存在"

# 创建宝塔专用启动脚本
echo "📝 创建宝塔启动脚本..."
cat > $SYNC_DIR/baota-start.sh << 'EOF'
#!/bin/bash

echo "🚀 宝塔环境启动脚本"
echo "===================="

# 项目目录
PROJECT_DIR="/www/wwwroot/learning-platform"
cd $PROJECT_DIR

# 停止现有进程
echo "🛑 停止现有服务..."
pkill -f "node server.cjs" 2>/dev/null || true
pkill -f "learning-platform" 2>/dev/null || true
sleep 2

# 设置端口（宝塔Node项目默认使用3000端口）
export PORT=3000
export NODE_ENV=production

echo "🔧 环境变量:"
echo "   PORT: $PORT"
echo "   NODE_ENV: $NODE_ENV"
echo "   项目目录: $PROJECT_DIR"

# 检查Node.js
node --version
npm --version

# 启动服务器
echo "🚀 启动服务器..."
if [ -f "server.cjs" ]; then
    echo "使用 server.cjs 启动..."
    nohup node server.cjs > server.log 2>&1 &
    SERVER_PID=$!
    echo "服务器进程ID: $SERVER_PID"
elif [ -f "server/app.js" ]; then
    echo "使用 server/app.js 启动..."
    cd server && npm install --production
    cd ..
    nohup node server/app.js > server.log 2>&1 &
    SERVER_PID=$!
    echo "服务器进程ID: $SERVER_PID"
else
    echo "❌ 找不到启动文件"
    exit 1
fi

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

# 检查服务器状态
if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "✅ 服务器启动成功！"
    echo "🌐 内部访问: http://localhost:$PORT"
    echo "🌍 外部访问: http://$(curl -s ifconfig.me):$PORT"
    echo "🔧 健康检查: http://localhost:$PORT/health"
    echo "📊 API状态: http://localhost:$PORT/api/status"
    echo ""
    echo "📋 服务器信息:"
    echo "   进程ID: $SERVER_PID"
    echo "   日志文件: server.log"
    echo "   配置: 内存存储模式，支持用户注册"
    echo ""
    echo "🎉 部署完成！您现在可以："
    echo "1. 访问网站进行用户注册"
    echo "2. 新注册的账号可以立即登录"
    echo "3. 账号数据存储在内存中（重启服务器后清空）"
else
    echo "❌ 服务器启动失败"
    echo "📋 查看日志:"
    tail -20 server.log
    exit 1
fi
EOF

chmod +x $SYNC_DIR/baota-start.sh

# 创建快速重启脚本
cat > $SYNC_DIR/restart.sh << 'EOF'
#!/bin/bash
echo "🔄 重启学习平台服务..."
pkill -f "node server.cjs" 2>/dev/null || true
pkill -f "learning-platform" 2>/dev/null || true
sleep 2
./baota-start.sh
EOF

chmod +x $SYNC_DIR/restart.sh

# 创建用户注册测试脚本
cat > $SYNC_DIR/test-register.sh << 'EOF'
#!/bin/bash
echo "🧪 测试用户注册功能..."

# 测试数据
USERNAME="testuser$(date +%s)"
PASSWORD="123456"
NAME="测试用户"

echo "测试用户: $USERNAME"

# 注册用户
echo "📝 注册新用户..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\",
    \"role\": \"user\",
    \"email\": \"test@example.com\",
    \"department\": \"测试部门\"
  }")

echo "注册响应: $RESPONSE"

# 测试登录
echo "🔐 测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }")

echo "登录响应: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 用户注册和登录测试成功！"
else
    echo "❌ 测试失败"
fi
EOF

chmod +x $SYNC_DIR/test-register.sh

echo -e "${GREEN}✅ 同步包创建成功: $SYNC_DIR${NC}"

# 3. 上传到宝塔服务器
echo -e "${YELLOW}📤 上传到宝塔服务器...${NC}"
echo "请输入服务器密码:"

# 创建远程目录
ssh $SERVER_USER@$SERVER_IP "mkdir -p $BAOTA_PROJECT_DIR"

# 上传文件
echo "🚚 传输文件到宝塔服务器..."
scp -r $SYNC_DIR/* $SERVER_USER@$SERVER_IP:$BAOTA_PROJECT_DIR/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 文件上传失败${NC}"
    rm -rf $SYNC_DIR
    exit 1
fi

echo -e "${GREEN}✅ 文件上传成功${NC}"

# 4. 远程执行部署
echo -e "${YELLOW}🚀 远程启动服务...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
cd $BAOTA_PROJECT_DIR

# 设置执行权限
chmod +x *.sh

echo "📂 当前目录文件:"
ls -la *.sh *.cjs *.html 2>/dev/null || echo "部分文件可能不存在"

echo ""
echo "🚀 执行启动脚本..."
./baota-start.sh

echo ""
echo "🧪 运行用户注册测试..."
sleep 3
./test-register.sh
EOF

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 同步完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://$SERVER_IP${NC}"
echo -e "${GREEN}📝 注册页面: http://$SERVER_IP/register.html${NC}"
echo -e "${GREEN}🔧 健康检查: http://$SERVER_IP/health${NC}"
echo -e "${GREEN}📊 API状态: http://$SERVER_IP/api/status${NC}"
echo -e "${GREEN}================================${NC}"

echo ""
echo -e "${YELLOW}📋 后续操作建议:${NC}"
echo "1. 在宝塔面板中配置Node项目管理"
echo "2. 设置域名解析（如有需要）"
echo "3. 配置SSL证书（推荐）"
echo "4. 定期备份用户数据"
echo ""

echo -e "${YELLOW}🔧 管理命令:${NC}"
echo "重启服务: ssh $SERVER_USER@$SERVER_IP 'cd $BAOTA_PROJECT_DIR && ./restart.sh'"
echo "查看日志: ssh $SERVER_USER@$SERVER_IP 'cd $BAOTA_PROJECT_DIR && tail -f server.log'"
echo "测试注册: ssh $SERVER_USER@$SERVER_IP 'cd $BAOTA_PROJECT_DIR && ./test-register.sh'"

# 清理本地同步包
rm -rf $SYNC_DIR
echo ""
echo -e "${GREEN}🎉 宝塔同步完成！现在您可以使用用户注册功能了！${NC}"
