#!/bin/bash

echo "🚀 云服务器部署脚本"
echo "=================="

# 云服务器信息
CLOUD_IP="116.62.65.246"
CLOUD_USER="root"  # 根据实际情况修改用户名

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 目标服务器: $CLOUD_IP${NC}"
echo -e "${BLUE}👤 用户名: $CLOUD_USER${NC}"

# 1. 本地构建
echo -e "${YELLOW}🔨 本地构建项目...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 本地构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 本地构建成功${NC}"

# 2. 创建部署包
echo -e "${YELLOW}📦 创建部署包...${NC}"
DEPLOY_DIR="deploy-package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 复制必要文件
cp -r dist $DEPLOY_DIR/
cp server.js $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp ecosystem.config.js $DEPLOY_DIR/
cp deploy-cloud.sh $DEPLOY_DIR/
cp quick-deploy.sh $DEPLOY_DIR/

# 创建启动脚本
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
echo "🚀 启动云服务器应用..."

# 设置环境变量
export PORT=${PORT:-3000}
export NODE_ENV=production

# 安装依赖
npm install --production

# 启动服务器
echo "🌐 服务器端口: $PORT"
echo "🔧 环境模式: $NODE_ENV"
echo ""

node server.js
EOF

chmod +x $DEPLOY_DIR/start.sh

echo -e "${GREEN}✅ 部署包创建成功${NC}"

# 3. 上传到云服务器
echo -e "${YELLOW}📤 上传到云服务器...${NC}"
echo -e "${YELLOW}请输入云服务器密码:${NC}"

# 使用 scp 上传文件
scp -r $DEPLOY_DIR/* $CLOUD_USER@$CLOUD_IP:/root/learning-platform/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 文件上传失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 文件上传成功${NC}"

# 4. 远程启动
echo -e "${YELLOW}🚀 远程启动服务器...${NC}"
ssh $CLOUD_USER@$CLOUD_IP << 'EOF'
cd /root/learning-platform
chmod +x *.sh
./start.sh
EOF

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 云服务器部署完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}🔧 健康检查: http://$CLOUD_IP:3000/health${NC}"
echo -e "${GREEN}📊 API状态: http://$CLOUD_IP:3000/api/status${NC}"
echo -e "${GREEN}================================${NC}"

# 清理本地部署包
rm -rf $DEPLOY_DIR 