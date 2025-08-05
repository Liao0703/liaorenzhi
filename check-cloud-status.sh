#!/bin/bash

echo "🔍 云服务器状态检查"
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

echo -e "${BLUE}🌐 检查服务器: $CLOUD_IP${NC}"

# 1. 检查服务器连通性
echo -e "${YELLOW}🔍 检查服务器连通性...${NC}"
if ping -c 1 $CLOUD_IP &> /dev/null; then
    echo -e "${GREEN}✅ 服务器连通正常${NC}"
else
    echo -e "${RED}❌ 服务器无法连通${NC}"
    exit 1
fi

# 2. 检查端口状态
echo -e "${YELLOW}🔍 检查端口 3000...${NC}"
if nc -z $CLOUD_IP 3000 2>/dev/null; then
    echo -e "${GREEN}✅ 端口 3000 开放${NC}"
else
    echo -e "${RED}❌ 端口 3000 未开放${NC}"
fi

# 3. 检查 HTTP 服务
echo -e "${YELLOW}🔍 检查 HTTP 服务...${NC}"
HEALTH_RESPONSE=$(curl -s --connect-timeout 5 http://$CLOUD_IP:3000/health 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$HEALTH_RESPONSE" ]; then
    echo -e "${GREEN}✅ HTTP 服务正常${NC}"
    echo -e "${BLUE}📊 健康检查响应: $HEALTH_RESPONSE${NC}"
else
    echo -e "${RED}❌ HTTP 服务异常${NC}"
fi

# 4. 检查 API 状态
echo -e "${YELLOW}🔍 检查 API 状态...${NC}"
API_RESPONSE=$(curl -s --connect-timeout 5 http://$CLOUD_IP:3000/api/status 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$API_RESPONSE" ]; then
    echo -e "${GREEN}✅ API 服务正常${NC}"
    echo -e "${BLUE}📊 API 响应: $API_RESPONSE${NC}"
else
    echo -e "${RED}❌ API 服务异常${NC}"
fi

# 5. 检查主页面
echo -e "${YELLOW}🔍 检查主页面...${NC}"
MAIN_RESPONSE=$(curl -s --connect-timeout 5 -I http://$CLOUD_IP:3000/ 2>/dev/null | head -1)
if [ $? -eq 0 ] && echo "$MAIN_RESPONSE" | grep -q "200"; then
    echo -e "${GREEN}✅ 主页面正常${NC}"
else
    echo -e "${RED}❌ 主页面异常${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🌐 服务器地址: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}🔧 健康检查: http://$CLOUD_IP:3000/health${NC}"
echo -e "${GREEN}📊 API状态: http://$CLOUD_IP:3000/api/status${NC}"
echo -e "${GREEN}================================${NC}" 