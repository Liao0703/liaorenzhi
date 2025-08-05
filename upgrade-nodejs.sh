#!/bin/bash

echo "🔄 Node.js 升级脚本"
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
echo -e "${YELLOW}⚠️  注意：这将升级Node.js到v20版本${NC}"
echo -e "${YELLOW}💡 建议：先备份重要数据${NC}"

read -p "确认要升级Node.js吗? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "取消升级"
    exit 0
fi

echo -e "${YELLOW}🚀 开始升级Node.js...${NC}"

ssh $CLOUD_USER@$CLOUD_IP << 'EOF'
echo "📋 当前Node.js版本:"
node --version
npm --version

echo "📦 安装Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "✅ 升级完成，新版本:"
node --version
npm --version

echo "🔄 重启服务..."
cd /root/learning-platform
pkill -f "node server.cjs" || true
sleep 2

# 重新安装依赖（清除版本警告）
echo "📦 重新安装依赖..."
rm -rf node_modules
npm install --production

# 启动服务
echo "🚀 启动服务..."
nohup node server.cjs > app.log 2>&1 &
sleep 3

# 检查服务状态
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 升级成功！服务正常运行"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ 升级后服务启动失败，请检查日志"
    tail -10 app.log
fi
EOF

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Node.js升级完成${NC}"
echo -e "${GREEN}🌐 访问地址: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}================================${NC}"