#!/bin/bash

echo "🔧 同步修复到云服务器"
echo "===================="

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
echo -e "${YELLOW}🔨 检查并构建项目...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端构建完成${NC}"

# 2. 创建同步包
echo -e "${YELLOW}📦 创建同步包...${NC}"
SYNC_DIR="sync-fixes"
rm -rf $SYNC_DIR
mkdir -p $SYNC_DIR

# 复制前端文件
echo "📋 复制前端文件..."
cp -r dist $SYNC_DIR/
cp -r src $SYNC_DIR/
cp package.json $SYNC_DIR/
cp vite.config.ts $SYNC_DIR/
cp tsconfig.json $SYNC_DIR/
cp tsconfig.app.json $SYNC_DIR/
cp tsconfig.node.json $SYNC_DIR/
cp index.html $SYNC_DIR/

# 复制后端文件
echo "📋 复制后端文件..."
mkdir -p $SYNC_DIR/server
cp -r server/* $SYNC_DIR/server/

# 复制启动脚本
cp server.js $SYNC_DIR/ 2>/dev/null || true
cp ecosystem.config.js $SYNC_DIR/ 2>/dev/null || true

# 创建维护用户密码更新脚本
cat > $SYNC_DIR/server/update-maintenance-password.js << 'EOF'
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const updatePassword = async () => {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'learning_platform'
    });

    // 生成新密码的哈希值
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('新密码:', newPassword);
    console.log('密码哈希:', hashedPassword);

    // 更新数据库
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'maintenance']
    );

    console.log('更新结果:', result);
    console.log('✅ maintenance用户密码已更新为: 123456');

    await connection.end();
  } catch (error) {
    console.error('❌ 更新密码失败:', error);
  }
};

updatePassword();
EOF

# 创建远程启动脚本
cat > $SYNC_DIR/deploy-fixes.sh << 'EOF'
#!/bin/bash

echo "🔧 部署修复"
echo "=========="

# 设置环境变量
export PORT=${PORT:-3000}
export NODE_ENV=production

# 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "node.*app.js" || true
pkill -f "node.*server.js" || true
pm2 stop all || true
sleep 3

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install --production

# 安装后端依赖
echo "📦 安装后端依赖..."
cd server
npm install --production
cd ..

# 更新维护用户密码
echo "🔐 更新维护用户密码..."
cd server
node update-maintenance-password.js
cd ..

# 启动后端服务器
echo "🚀 启动后端服务器..."
cd server
nohup node app.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# 检查后端是否启动
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 后端服务启动成功 (端口 3001)"
else
    echo "⚠️  后端服务可能未正常启动，继续前端部署"
fi

# 启动前端服务器
echo "🚀 启动前端服务器..."
if [ -f server.js ]; then
    # 如果有server.js，使用它
    nohup node server.js > frontend.log 2>&1 &
    FRONTEND_PID=$!
else
    # 否则使用静态文件服务
    nohup npx serve dist -l $PORT > frontend.log 2>&1 &
    FRONTEND_PID=$!
fi

# 等待服务器启动
sleep 5

# 检查前端服务器是否启动成功
if curl -s http://localhost:$PORT > /dev/null; then
    echo "✅ 前端服务器启动成功！"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me):$PORT"
    echo "🔧 后端API: http://$(curl -s ifconfig.me):3001"
    echo "📋 前端进程ID: $FRONTEND_PID"
    echo "📋 后端进程ID: $BACKEND_PID"
    echo "📄 前端日志: frontend.log"
    echo "📄 后端日志: backend.log"
else
    echo "❌ 前端服务器启动失败"
    echo "📋 查看前端日志:"
    tail -10 frontend.log
    echo "📋 查看后端日志:"
    tail -10 backend.log
    exit 1
fi
EOF

chmod +x $SYNC_DIR/deploy-fixes.sh

echo -e "${GREEN}✅ 同步包创建成功${NC}"

# 3. 上传到云服务器
echo -e "${YELLOW}📤 上传到云服务器...${NC}"
echo -e "${YELLOW}请输入云服务器密码:${NC}"

# 创建远程目录
ssh $CLOUD_USER@$CLOUD_IP "mkdir -p /root/learning-platform-fixes"

# 上传文件
scp -r $SYNC_DIR/* $CLOUD_USER@$CLOUD_IP:/root/learning-platform-fixes/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 文件上传失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 文件上传成功${NC}"

# 4. 远程部署
echo -e "${YELLOW}🚀 远程部署修复...${NC}"
ssh $CLOUD_USER@$CLOUD_IP << 'EOF'
cd /root/learning-platform-fixes

# 执行部署脚本
./deploy-fixes.sh

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 3

# 检查前端
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务正常运行"
else
    echo "❌ 前端服务异常"
fi

# 检查后端
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 后端服务正常运行"
else
    echo "❌ 后端服务异常"
fi

echo "🌐 外部访问地址: http://$(curl -s ifconfig.me):3000"
echo "🔧 后端API地址: http://$(curl -s ifconfig.me):3001"
EOF

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 修复同步完成！${NC}"
echo -e "${GREEN}🌐 前端访问: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}🔧 后端API: http://$CLOUD_IP:3001${NC}"
echo -e "${GREEN}🔐 维护账户: maintenance/123456${NC}"
echo -e "${GREEN}================================${NC}"

# 清理本地同步包
rm -rf $SYNC_DIR

echo -e "${YELLOW}🔍 验证修复结果...${NC}"
sleep 3

# 测试登录API
echo "测试维护用户登录..."
curl -X POST "http://$CLOUD_IP:3001/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username":"maintenance","password":"123456"}' \
     -s | grep -q "success.*true" && echo "✅ 维护用户登录测试成功" || echo "❌ 维护用户登录测试失败" 