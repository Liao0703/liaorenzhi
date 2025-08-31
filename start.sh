#!/bin/bash

# 兴站智训通 - 快速启动脚本
# 一键启动兴站智训通

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
cat << "EOF"
  ______ _____ ____ ____  ___  _____ _     _____ _____ _____ _____
 |  ____|_   _|  _ \    |/ _ \|_   _| |   | ____|_   _|_   _|  ___|
 | |__    | | | |_) |   / /_\ \ | | | |   | |__   | |   | | | |__
 |  __|   | | |  _ <   /  _  _| | | | |   | |__|  | |   | | |  __|
 | |     _| |_| |_) | /  / | | _| |_| |___| |___  | |  _| |_| |
 |_|    |_____|____/ /__/  |_| \___/|_____|_____| |_| |_____|_|

 兴站智训通
 XingZhan ZhiXunTong

EOF
echo -e "${NC}"

echo -e "${GREEN}🚂 欢迎使用兴站智训通！${NC}"
echo ""

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker未安装，请先安装Docker${NC}"
    echo "安装教程: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose未安装，请先安装Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker环境检查通过${NC}"
echo ""

# 检查配置文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}📄 创建配置文件...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ 已从env.example创建.env配置文件${NC}"
        echo -e "${YELLOW}💡 请根据需要修改.env文件中的配置${NC}"
    else
        echo -e "${RED}❌ env.example文件不存在${NC}"
        exit 1
    fi
    echo ""
fi

# 询问启动模式
echo -e "${YELLOW}🔧 请选择启动模式:${NC}"
echo "1) 开发模式 (dev) - 适合开发和测试"
echo "2) 生产模式 (prod) - 适合生产部署"
echo ""
read -p "请输入选择 (1-2, 默认1): " mode_choice

case $mode_choice in
    2)
        mode="prod"
        echo -e "${GREEN}🏭 选择了生产模式${NC}"
        ;;
    *)
        mode="dev"
        echo -e "${GREEN}🔧 选择了开发模式${NC}"
        ;;
esac
echo ""

# 询问是否清理现有数据
read -p "是否清理现有容器和数据? (y/N): " clean_choice
if [[ $clean_choice =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️ 清理现有数据...${NC}"
    docker-compose down -v --remove-orphans 2>/dev/null || true
    docker system prune -f
    echo -e "${GREEN}✅ 清理完成${NC}"
    echo ""
fi

# 创建必要目录
echo -e "${YELLOW}📁 创建必要目录...${NC}"
mkdir -p data/{mysql,redis,uploads,logs,backups}
sudo chown -R $USER:$USER data/ 2>/dev/null || true
chmod -R 755 data/

# 启动服务
echo -e "${GREEN}🚀 启动服务...${NC}"
echo ""

if [ "$mode" = "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    docker-compose up -d
fi

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动完成...${NC}"

# 等待MySQL
echo -n "等待MySQL启动"
for i in {1..30}; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        break
    fi
    echo -n "."
    sleep 2
done
echo " ✅"

# 等待Redis
echo -n "等待Redis启动"
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo " ✅"

# 等待后端
echo -n "等待后端API启动"
for i in {1..30}; do
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo " ✅"

# 等待前端
echo -n "等待前端服务启动"
for i in {1..30}; do
    if curl -f http://localhost/ >/dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo " ✅"

echo ""
echo -e "${GREEN}"
cat << "EOF"
🎉 兴站智训通启动成功！
================================

📱 前端应用: http://localhost
🔧 后端API: http://localhost:3001
📊 健康检查: http://localhost:3001/health
🗂️ API文档: http://localhost:3001/api-docs
🛡️ 监控面板: http://localhost:3001/monitoring

默认账号:
👤 管理员: admin / admin123456
👤 演示用户: demo / demo123456
👤 维护用户: maintenance / maintenance123456

常用命令:
查看状态: docker-compose ps
查看日志: docker-compose logs -f
停止服务: docker-compose down
重启服务: docker-compose restart

EOF
echo -e "${NC}"

# 询问是否打开浏览器
if command -v open &> /dev/null; then
    read -p "是否打开浏览器访问应用? (Y/n): " open_browser
    if [[ ! $open_browser =~ ^[Nn]$ ]]; then
        open http://localhost
    fi
elif command -v xdg-open &> /dev/null; then
    read -p "是否打开浏览器访问应用? (Y/n): " open_browser
    if [[ ! $open_browser =~ ^[Nn]$ ]]; then
        xdg-open http://localhost
    fi
fi

echo -e "${GREEN}🌟 享受使用兴站智训通！${NC}"
