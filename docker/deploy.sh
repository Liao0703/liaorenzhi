#!/bin/bash

# 铁路学习平台 Docker 部署脚本
# 作者: 系统架构师
# 版本: 1.0.0
# 创建时间: 2025-01-19

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] 警告: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] 错误: $1${NC}"
    exit 1
}

# 显示使用说明
show_usage() {
    cat << EOF
铁路学习平台 Docker 部署脚本

使用方法:
    $0 [选项] [环境]

选项:
    -h, --help              显示此帮助信息
    -v, --version           显示版本信息
    -c, --clean             清理现有容器和数据卷
    --build-only            仅构建镜像，不启动服务
    --logs                  查看服务日志
    --status                查看服务状态

环境:
    dev         开发环境 (默认)
    prod        生产环境
    test        测试环境

示例:
    $0 dev                  启动开发环境
    $0 prod                 启动生产环境
    $0 --clean dev          清理并重新部署开发环境
    $0 --logs              查看所有服务日志
    $0 --status            查看服务运行状态

EOF
}

# 检查系统要求
check_requirements() {
    log "检查系统要求..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        error "Docker未安装，请先安装Docker"
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose未安装，请先安装Docker Compose"
    fi
    
    # 检查可用内存
    available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 2048 ]; then
        warn "可用内存少于2GB，可能影响性能"
    fi
    
    # 检查磁盘空间
    available_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        warn "可用磁盘空间少于10GB，请确保有足够空间"
    fi
    
    log "系统要求检查完成"
}

# 创建必要的目录和文件
prepare_environment() {
    log "准备环境..."
    
    # 创建数据目录
    mkdir -p data/{mysql,redis,uploads,logs,backups}
    
    # 创建.env文件（如果不存在）
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            log "创建.env配置文件..."
            cp env.example .env
            warn "请编辑.env文件配置相关参数"
        else
            error ".env.example文件不存在，无法创建配置文件"
        fi
    fi
    
    # 设置目录权限
    sudo chown -R $USER:$USER data/
    chmod -R 755 data/
    
    log "环境准备完成"
}

# 清理现有容器和数据
cleanup() {
    log "清理现有容器和数据卷..."
    
    # 停止并删除容器
    if docker-compose ps -q > /dev/null 2>&1; then
        docker-compose down -v --remove-orphans
    fi
    
    # 删除镜像（可选）
    if [ "$CLEAN_IMAGES" = "true" ]; then
        docker images | grep learning-platform | awk '{print $3}' | xargs -r docker rmi -f
    fi
    
    # 清理数据卷
    docker volume prune -f
    
    # 清理网络
    docker network prune -f
    
    log "清理完成"
}

# 构建镜像
build_images() {
    log "构建Docker镜像..."
    
    # 构建后端镜像
    log "构建后端镜像..."
    docker-compose build backend
    
    # 构建前端镜像
    log "构建前端镜像..."
    docker-compose build frontend
    
    log "镜像构建完成"
}

# 启动服务
start_services() {
    local env=$1
    log "启动 $env 环境服务..."
    
    case $env in
        "dev")
            docker-compose up -d
            ;;
        "prod")
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
            ;;
        "test")
            docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
            ;;
        *)
            error "未知环境: $env"
            ;;
    esac
    
    log "$env 环境服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log "等待服务启动..."
    
    # 等待MySQL
    local mysql_ready=0
    for i in {1..30}; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
            mysql_ready=1
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ $mysql_ready -eq 0 ]; then
        error "MySQL启动超时"
    fi
    
    # 等待Redis
    local redis_ready=0
    for i in {1..30}; do
        if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            redis_ready=1
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ $redis_ready -eq 0 ]; then
        error "Redis启动超时"
    fi
    
    # 等待后端API
    local backend_ready=0
    for i in {1..30}; do
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            backend_ready=1
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ $backend_ready -eq 0 ]; then
        error "后端API启动超时"
    fi
    
    # 等待前端
    local frontend_ready=0
    for i in {1..30}; do
        if curl -f http://localhost/ > /dev/null 2>&1; then
            frontend_ready=1
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ $frontend_ready -eq 0 ]; then
        error "前端服务启动超时"
    fi
    
    echo ""
    log "所有服务已就绪"
}

# 显示部署结果
show_deployment_info() {
    local env=$1
    
    cat << EOF

${GREEN}
🎉 铁路学习平台部署成功！
================================

环境: $env

服务访问地址:
📱 前端应用: http://localhost
🔧 后端API: http://localhost:3001
📊 健康检查: http://localhost:3001/health
🗂️ API文档: http://localhost:3001/api-docs
🛡️ 监控面板: http://localhost:3001/monitoring

数据库连接:
🗄️ MySQL: localhost:3306
🚀 Redis: localhost:6379

管理员账号:
👤 用户名: admin
🔑 密码: admin123456

演示账号:
👤 用户名: demo  
🔑 密码: demo123456

常用命令:
查看日志: docker-compose logs -f [服务名]
停止服务: docker-compose down
重启服务: docker-compose restart [服务名]
进入容器: docker-compose exec [服务名] /bin/sh

${NC}
EOF
}

# 查看服务状态
show_status() {
    log "查看服务状态..."
    
    echo ""
    echo "=== Docker Compose 服务状态 ==="
    docker-compose ps
    
    echo ""
    echo "=== 容器资源使用情况 ==="
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    echo "=== 服务健康检查 ==="
    
    # 检查各个服务
    services=("frontend:80" "backend:3001" "mysql:3306" "redis:6379")
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✅ $name: 运行正常${NC}"
        else
            echo -e "${RED}❌ $name: 服务异常${NC}"
        fi
    done
}

# 查看日志
show_logs() {
    log "显示服务日志..."
    docker-compose logs -f --tail=100
}

# 主函数
main() {
    local environment="dev"
    local clean=false
    local build_only=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--version)
                echo "铁路学习平台部署脚本 v1.0.0"
                exit 0
                ;;
            -c|--clean)
                clean=true
                shift
                ;;
            --build-only)
                build_only=true
                shift
                ;;
            --logs)
                show_logs
                exit 0
                ;;
            --status)
                show_status
                exit 0
                ;;
            dev|prod|test)
                environment=$1
                shift
                ;;
            *)
                error "未知参数: $1"
                ;;
        esac
    done
    
    log "开始部署铁路学习平台 ($environment 环境)..."
    
    # 检查系统要求
    check_requirements
    
    # 准备环境
    prepare_environment
    
    # 清理（如果需要）
    if [ "$clean" = true ]; then
        cleanup
    fi
    
    # 构建镜像
    build_images
    
    # 如果只是构建镜像，则退出
    if [ "$build_only" = true ]; then
        log "镜像构建完成，退出"
        exit 0
    fi
    
    # 启动服务
    start_services $environment
    
    # 等待服务就绪
    wait_for_services
    
    # 显示部署结果
    show_deployment_info $environment
}

# 捕获信号，优雅退出
trap 'error "部署中断"' INT TERM

# 运行主函数
main "$@"
