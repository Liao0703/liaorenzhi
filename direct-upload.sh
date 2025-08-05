#!/bin/bash

echo "📤 直接上传到云服务器"
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

# 2. 创建部署包
echo -e "${YELLOW}📦 创建部署包...${NC}"
DEPLOY_DIR="direct-deploy"
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
    echo "🔧 健康检查: http://$(curl -s ifconfig.me):3000/health"
else
    echo "❌ 服务启动失败"
    tail -10 app.log
fi
EOF

chmod +x $DEPLOY_DIR/start.sh

echo -e "${GREEN}✅ 部署包已创建: $DEPLOY_DIR${NC}"

# 3. 尝试不同的上传方法
echo -e "${YELLOW}📤 尝试上传文件...${NC}"

# 方法1: 使用 rsync (如果可用)
if command -v rsync &> /dev/null; then
    echo -e "${YELLOW}尝试使用 rsync...${NC}"
    rsync -avz --progress $DEPLOY_DIR/ $CLOUD_USER@$CLOUD_IP:/root/learning-platform/
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ rsync 上传成功${NC}"
        UPLOAD_SUCCESS=true
    fi
fi

# 方法2: 使用 scp (如果 rsync 失败)
if [ "$UPLOAD_SUCCESS" != "true" ]; then
    echo -e "${YELLOW}尝试使用 scp...${NC}"
    scp -r $DEPLOY_DIR/* $CLOUD_USER@$CLOUD_IP:/root/learning-platform/
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ scp 上传成功${NC}"
        UPLOAD_SUCCESS=true
    fi
fi

# 方法3: 使用 sftp (如果 scp 失败)
if [ "$UPLOAD_SUCCESS" != "true" ]; then
    echo -e "${YELLOW}尝试使用 sftp...${NC}"
    echo "put -r $DEPLOY_DIR/*" | sftp $CLOUD_USER@$CLOUD_IP:/root/learning-platform/
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ sftp 上传成功${NC}"
        UPLOAD_SUCCESS=true
    fi
fi

if [ "$UPLOAD_SUCCESS" = "true" ]; then
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✅ 文件上传成功！${NC}"
    echo -e "${GREEN}🌐 访问地址: http://$CLOUD_IP:3000${NC}"
    echo -e "${GREEN}🔧 健康检查: http://$CLOUD_IP:3000/health${NC}"
    echo -e "${GREEN}================================${NC}"
    
    echo -e "${YELLOW}💡 下一步:${NC}"
    echo -e "${YELLOW}1. 登录云服务器: ssh $CLOUD_USER@$CLOUD_IP${NC}"
    echo -e "${YELLOW}2. 启动应用: cd /root/learning-platform && ./start.sh${NC}"
else
    echo -e "${RED}❌ 所有上传方法都失败了${NC}"
    echo -e "${YELLOW}请手动上传 $DEPLOY_DIR 目录到云服务器${NC}"
fi

# 清理
rm -rf $DEPLOY_DIR 