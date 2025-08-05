#!/bin/bash

echo "🔧 手动同步配置指南"
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

# 显示公钥
echo -e "${YELLOW}📋 你的 SSH 公钥:${NC}"
cat ~/.ssh/id_rsa.pub

echo ""
echo -e "${YELLOW}🔧 请按以下步骤手动配置云服务器:${NC}"
echo ""
echo -e "${BLUE}步骤 1: 登录云服务器${NC}"
echo -e "${YELLOW}ssh $CLOUD_USER@$CLOUD_IP${NC}"
echo ""
echo -e "${BLUE}步骤 2: 创建 SSH 目录${NC}"
echo -e "${YELLOW}mkdir -p ~/.ssh${NC}"
echo -e "${YELLOW}chmod 700 ~/.ssh${NC}"
echo ""
echo -e "${BLUE}步骤 3: 添加公钥${NC}"
echo -e "${YELLOW}echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys${NC}"
echo -e "${YELLOW}chmod 600 ~/.ssh/authorized_keys${NC}"
echo ""
echo -e "${BLUE}步骤 4: 配置 SSH 服务${NC}"
echo -e "${YELLOW}sudo nano /etc/ssh/sshd_config${NC}"
echo -e "${YELLOW}确保以下设置:${NC}"
echo -e "${YELLOW}  PasswordAuthentication yes${NC}"
echo -e "${YELLOW}  PubkeyAuthentication yes${NC}"
echo -e "${YELLOW}  AuthorizedKeysFile .ssh/authorized_keys${NC}"
echo ""
echo -e "${BLUE}步骤 5: 重启 SSH 服务${NC}"
echo -e "${YELLOW}sudo systemctl restart sshd${NC}"
echo ""

# 构建项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build

# 创建部署包
echo -e "${YELLOW}📦 创建部署包...${NC}"
DEPLOY_DIR="manual-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

cp -r dist $DEPLOY_DIR/
cp server.js $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/

# 创建启动脚本
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
echo "🚀 启动应用..."

# 停止现有服务
pkill -f "node server.js" || true
sleep 2

# 安装依赖
npm install --production

# 启动服务
nohup node server.js > app.log 2>&1 &

# 等待启动
sleep 3

# 检查状态
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 服务启动成功！"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ 服务启动失败"
    tail -10 app.log
fi
EOF

chmod +x $DEPLOY_DIR/start.sh

echo -e "${GREEN}✅ 部署包已创建: $DEPLOY_DIR${NC}"
echo ""
echo -e "${YELLOW}📤 手动上传步骤:${NC}"
echo -e "${YELLOW}1. 将 $DEPLOY_DIR 目录上传到云服务器${NC}"
echo -e "${YELLOW}2. 在云服务器上运行: cd /root/learning-platform && ./start.sh${NC}"
echo ""
echo -e "${GREEN}🌐 完成后访问: http://$CLOUD_IP:3000${NC}" 