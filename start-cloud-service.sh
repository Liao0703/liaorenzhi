#!/bin/bash

echo "🚀 启动云服务 - 前端登录系统"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查环境
echo -e "${YELLOW}🔍 检查环境...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本: $(node --version)${NC}"

# 安装依赖
echo -e "${YELLOW}📦 检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
fi

# 安装服务器依赖
echo -e "${YELLOW}📦 检查服务器依赖...${NC}"
cd server
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安装服务器依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 服务器依赖安装失败${NC}"
        exit 1
    fi
fi
cd ..

# 构建前端
echo -e "${YELLOW}🔨 构建前端...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败：dist 目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 前端构建成功${NC}"

# 设置环境变量
export PORT=3000
export NODE_ENV=production

echo -e "${BLUE}🔧 配置信息:${NC}"
echo -e "${BLUE}   - 前端端口: $PORT${NC}"
echo -e "${BLUE}   - API端口: 3001${NC}"
echo -e "${BLUE}   - 环境: $NODE_ENV${NC}"

# 检查端口占用
echo -e "${YELLOW}🔍 检查端口占用...${NC}"

for port in 3000 3001; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用，正在停止占用进程...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
    fi
done

# 启动后端API服务器（后台）
echo -e "${YELLOW}🔧 启动API服务器...${NC}"
cd server
node start.js &
API_PID=$!
cd ..

# 等待API服务器启动
sleep 3

# 检查API服务器是否启动成功
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ API服务器启动失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ API服务器启动成功 (PID: $API_PID)${NC}"

# 启动前端服务器
echo -e "${YELLOW}🚀 启动前端服务器...${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 云服务启动成功！${NC}"
echo -e "${GREEN}🌐 前端访问: http://localhost:$PORT${NC}"
echo -e "${GREEN}🌐 云服务访问: http://116.62.65.246:$PORT${NC}"
echo -e "${GREEN}🔧 健康检查: http://localhost:$PORT/health${NC}"
echo -e "${GREEN}📊 API服务: http://localhost:3001/api${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo -e "${YELLOW}   - 按 Ctrl+C 停止所有服务${NC}"
echo -e "${YELLOW}   - API服务器PID: $API_PID${NC}"
echo ""

# 停止服务的函数
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 正在停止服务...${NC}"
    kill $API_PID 2>/dev/null
    echo -e "${GREEN}✅ 服务已停止${NC}"
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 启动前端服务器
node server.js

# 如果前端服务器退出，也要清理后端
cleanup