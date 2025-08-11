#!/bin/bash
# 上传项目到服务器脚本
# 使用方法: bash upload-to-server.sh

# 服务器配置
SERVER_IP="116.62.65.246"
SERVER_USER="ubuntu"  # 请修改为你的服务器用户名
SERVER_PATH="/home/ubuntu/learning-platform"  # 请修改为目标路径

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================"
echo "🚀 上传项目到服务器"
echo "========================================"
echo "服务器: $SERVER_USER@$SERVER_IP"
echo "目标路径: $SERVER_PATH"
echo "========================================"

# 检查SSH连接
echo ""
echo "🔍 检查SSH连接..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" exit 2>/dev/null; then
    echo -e "${GREEN}✅ SSH连接正常${NC}"
else
    echo -e "${RED}❌ SSH连接失败，请检查：${NC}"
    echo "1. 服务器IP是否正确: $SERVER_IP"
    echo "2. 用户名是否正确: $SERVER_USER"
    echo "3. SSH密钥是否配置"
    echo "4. 服务器是否允许SSH连接"
    exit 1
fi

# 询问是否继续
echo ""
read -p "确认上传到 $SERVER_USER@$SERVER_IP:$SERVER_PATH? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消上传"
    exit 1
fi

# 创建服务器目录
echo ""
echo "📁 创建服务器目录..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $SERVER_PATH"

# 上传项目文件
echo ""
echo "📤 上传项目文件..."

# 上传部署脚本
echo "上传部署脚本..."
scp deploy-*.sh "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
scp BACKEND_DEPLOYMENT_GUIDE.md "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

# 上传服务器端代码
echo "上传服务器端代码..."
scp -r server/ "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

# 上传项目配置文件
echo "上传项目配置文件..."
scp package.json "$SERVER_USER@$SERVER_IP:$SERVER_PATH/" 2>/dev/null || true
scp package-lock.json "$SERVER_USER@$SERVER_IP:$SERVER_PATH/" 2>/dev/null || true

# 设置脚本执行权限
echo ""
echo "🔧 设置脚本执行权限..."
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && chmod +x deploy-*.sh"

# 验证上传
echo ""
echo "🔍 验证上传结果..."
echo "服务器文件列表："
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && ls -la deploy-*.sh BACKEND_DEPLOYMENT_GUIDE.md server/"

echo ""
echo -e "${GREEN}✅ 上传完成！${NC}"
echo ""
echo "📋 下一步操作："
echo "1. 连接到服务器:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "2. 进入项目目录:"
echo "   cd $SERVER_PATH"
echo ""
echo "3. 开始部署:"
echo "   bash deploy-backend-complete.sh"
echo ""
echo "========================================"
