#!/bin/bash

echo "🚀 云服务器部署脚本"
echo "=================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}📁 当前目录: $(pwd)${NC}"

# 1. 检查 Node.js
echo -e "${YELLOW}🔍 检查 Node.js 版本...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js 版本: $NODE_VERSION${NC}"

# 2. 安装依赖
echo -e "${YELLOW}📦 安装项目依赖...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 依赖已存在${NC}"
fi

# 3. 构建项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 项目构建失败${NC}"
    exit 1
fi

# 检查构建结果
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败：dist 目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 项目构建成功${NC}"

# 4. 设置环境变量
export PORT=${PORT:-3000}
export NODE_ENV=production

echo -e "${BLUE}🌐 服务器端口: $PORT${NC}"
echo -e "${BLUE}🔧 环境模式: $NODE_ENV${NC}"

# 5. 检查端口占用
echo -e "${YELLOW}🔍 检查端口占用...${NC}"
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  端口 $PORT 已被占用，正在停止占用进程...${NC}"
    lsof -ti:$PORT | xargs kill -9
    sleep 2
fi

# 6. 启动服务器
echo -e "${YELLOW}🚀 启动生产服务器...${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 部署成功！${NC}"
echo -e "${GREEN}🌐 本地访问: http://localhost:$PORT${NC}"
echo -e "${GREEN}🔧 健康检查: http://localhost:$PORT/health${NC}"
echo -e "${GREEN}📊 API状态: http://localhost:$PORT/api/status${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo -e "${YELLOW}   - 按 Ctrl+C 停止服务器${NC}"
echo -e "${YELLOW}   - 使用 PM2 可以后台运行：pm2 start server.js${NC}"
echo -e "${YELLOW}   - 查看日志：pm2 logs${NC}"
echo ""

# 启动服务器
node server.js 