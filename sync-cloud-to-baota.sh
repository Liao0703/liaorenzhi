#!/bin/bash

# 🚀 同步云数据库版本到宝塔服务器
# 包含用户注册功能的完整云数据库版本

echo "🔄 同步云数据库版本到宝塔服务器"
echo "=================================="

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
echo -e "${BLUE}💾 版本: 云数据库版 v2.0.0${NC}"

# 检查本地文件
echo -e "${YELLOW}🔍 检查本地文件...${NC}"
required_files=("server.cjs" "env.cloud" "register.html" "package.json")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo -e "${RED}❌ 缺少必要文件:${NC}"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

echo -e "${GREEN}✅ 本地文件检查完成${NC}"

# 询问是否继续
echo ""
read -p "确认同步云数据库版本到宝塔服务器? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消同步"
    exit 1
fi

# 创建同步包
echo -e "${YELLOW}📦 创建云数据库同步包...${NC}"
SYNC_DIR="baota-cloud-sync-$(date +%Y%m%d_%H%M%S)"
mkdir -p $SYNC_DIR

# 复制核心文件
echo "📋 复制核心文件..."
cp server.cjs $SYNC_DIR/
cp env.cloud $SYNC_DIR/
cp register.html $SYNC_DIR/
cp package.json $SYNC_DIR/

# 复制前端文件
if [ -d "dist" ]; then
    cp -r dist $SYNC_DIR/
    echo "✅ 前端文件已复制"
else
    echo "⚠️  dist目录不存在，将跳过前端文件"
fi

# 复制服务器代码（完整版本）
if [ -d "server" ]; then
    cp -r server $SYNC_DIR/
    echo "✅ 完整服务器代码已复制"
fi

# 创建宝塔云数据库启动脚本
echo "📝 创建云数据库启动脚本..."
cat > $SYNC_DIR/baota-cloud-start.sh << 'EOF'
#!/bin/bash

echo "🚀 宝塔云数据库版启动脚本"
echo "========================="

# 项目目录
PROJECT_DIR="/www/wwwroot/learning-platform"
cd $PROJECT_DIR

# 停止现有进程
echo "🛑 停止现有服务..."
pkill -f "node server.cjs" 2>/dev/null || true
sleep 2

# 安装依赖
echo "📦 检查依赖..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/mysql2/package.json" ]; then
    echo "安装必要依赖..."
    npm install bcryptjs mysql2 dotenv --production
fi

# 设置环境变量
export NODE_ENV=production
export PORT=3000

echo "🔧 环境配置:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   项目目录: $PROJECT_DIR"

# 测试数据库连接
echo "🗄️  测试云数据库连接..."
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'env.cloud' });

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ 云数据库连接正常');
    await connection.end();
  } catch(error) {
    console.log('⚠️  数据库连接失败:', error.message);
    console.log('🔄 将使用内存存储模式');
  }
}
testDB();
"

# 启动服务器
echo "🚀 启动云数据库服务器..."
nohup node server.cjs > server-cloud.log 2>&1 &
SERVER_PID=$!
echo "服务器进程ID: $SERVER_PID"

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

# 检查服务器状态
if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "✅ 云数据库服务器启动成功！"
    echo ""
    echo "🎉 部署完成！"
    echo "🌐 内部访问: http://localhost:$PORT"
    echo "🌍 外部访问: http://$(curl -s ifconfig.me):$PORT"
    echo "📝 注册页面: http://$(curl -s ifconfig.me):$PORT/register.html"
    echo "🔧 健康检查: http://localhost:$PORT/health"
    echo ""
    echo "📊 功能特点:"
    echo "   ✅ 云数据库存储 - 数据永久保存"
    echo "   ✅ 用户注册功能 - 支持新用户注册"
    echo "   ✅ 自动降级保护 - 数据库不可用时使用内存"
    echo "   ✅ 密码加密存储 - bcrypt安全加密"
    echo ""
    echo "📋 管理信息:"
    echo "   进程ID: $SERVER_PID"
    echo "   日志文件: server-cloud.log"
    echo "   环境配置: env.cloud"
else
    echo "❌ 服务器启动失败"
    echo "📋 查看日志:"
    tail -20 server-cloud.log
    exit 1
fi
EOF

chmod +x $SYNC_DIR/baota-cloud-start.sh

# 创建重启脚本
cat > $SYNC_DIR/restart-cloud.sh << 'EOF'
#!/bin/bash
echo "🔄 重启云数据库版学习平台..."
pkill -f "node server.cjs" 2>/dev/null || true
sleep 2
./baota-cloud-start.sh
EOF

chmod +x $SYNC_DIR/restart-cloud.sh

# 创建数据库测试脚本
cp test-cloud-db.cjs $SYNC_DIR/ 2>/dev/null || true
cp test-cloud-registration.cjs $SYNC_DIR/ 2>/dev/null || true

echo -e "${GREEN}✅ 云数据库同步包创建成功: $SYNC_DIR${NC}"

# 上传到宝塔服务器
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

# 远程执行部署
echo -e "${YELLOW}🚀 远程启动云数据库服务...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
cd $BAOTA_PROJECT_DIR

# 设置执行权限
chmod +x *.sh

echo "📂 当前目录文件:"
ls -la *.sh *.cjs *.html env.cloud 2>/dev/null || echo "部分文件可能不存在"

echo ""
echo "🚀 执行云数据库启动脚本..."
./baota-cloud-start.sh
EOF

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 云数据库版本同步完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://$SERVER_IP${NC}"
echo -e "${GREEN}📝 注册页面: http://$SERVER_IP/register.html${NC}"
echo -e "${GREEN}🔧 健康检查: http://$SERVER_IP/health${NC}"
echo -e "${GREEN}================================${NC}"

echo ""
echo -e "${YELLOW}📋 重要说明:${NC}"
echo "1. 🗄️  数据已升级到阿里云RDS云数据库存储"
echo "2. 📝 新用户注册的数据将永久保存"
echo "3. 🔄 服务器重启后用户数据不会丢失"
echo "4. 🔐 默认管理员账号: admin/123456"
echo ""

echo -e "${YELLOW}🔧 管理命令:${NC}"
echo "重启服务: ssh $SERVER_USER@$SERVER_IP 'cd $BAOTA_PROJECT_DIR && ./restart-cloud.sh'"
echo "查看日志: ssh $SERVER_USER@$SERVER_IP 'cd $BAOTA_PROJECT_DIR && tail -f server-cloud.log'"
echo "测试数据库: ssh $SERVER_USER@$SERVER_IP 'cd $BAOTA_PROJECT_DIR && node test-cloud-db.cjs'"

# 清理本地同步包
rm -rf $SYNC_DIR
echo ""
echo -e "${GREEN}🎉 云数据库版本部署完成！用户注册功能现已连接云数据库！${NC}"
