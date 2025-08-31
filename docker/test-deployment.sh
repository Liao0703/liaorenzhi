#!/bin/bash

# Docker部署测试脚本
# 验证所有服务是否正常运行

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 日志函数
log() {
    echo -e "${GREEN}[TEST] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

success() {
    echo -e "${GREEN}[PASS] $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

fail() {
    echo -e "${RED}[FAIL] $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

# 测试函数
test_service() {
    local service_name=$1
    local test_command=$2
    local description=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "测试: $description"
    
    if eval $test_command >/dev/null 2>&1; then
        success "$service_name 服务正常"
    else
        fail "$service_name 服务异常"
        return 1
    fi
}

test_http_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "测试: $description"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        success "HTTP $url 返回 $status_code"
    else
        fail "HTTP $url 返回 $status_code (期望 $expected_status)"
        return 1
    fi
}

test_database_connection() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "测试: 数据库连接"
    
    if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        success "MySQL 数据库连接正常"
    else
        fail "MySQL 数据库连接失败"
        return 1
    fi
}

test_redis_connection() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "测试: Redis连接"
    
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        success "Redis 缓存连接正常"
    else
        fail "Redis 缓存连接失败"
        return 1
    fi
}

test_api_endpoints() {
    log "测试API端点..."
    
    # 基础端点测试
    test_http_endpoint "http://localhost:3001/health" "200" "健康检查端点"
    test_http_endpoint "http://localhost:3001/api-docs" "200" "API文档端点"
    test_http_endpoint "http://localhost:3001/monitoring" "200" "监控面板端点"
    
    # API端点测试
    test_http_endpoint "http://localhost:3001/api/monitoring/summary" "200" "监控摘要API"
    test_http_endpoint "http://localhost:3001/api/cache/stats" "200" "缓存统计API"
    
    # 认证端点测试（应该返回401或400）
    local auth_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/users" 2>/dev/null || echo "000")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$auth_status" = "401" ] || [ "$auth_status" = "400" ]; then
        success "用户API认证保护正常"
    else
        fail "用户API认证保护异常 (返回 $auth_status)"
    fi
}

test_frontend() {
    log "测试前端服务..."
    
    test_http_endpoint "http://localhost/" "200" "前端首页"
    
    # 测试静态资源
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "测试: 静态资源访问"
    
    local content_type=$(curl -s -I "http://localhost/" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r\n')
    if [[ $content_type == *"html"* ]]; then
        success "前端HTML内容类型正确"
    else
        fail "前端HTML内容类型异常: $content_type"
    fi
}

test_data_persistence() {
    log "测试数据持久性..."
    
    # 测试数据卷是否存在
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "测试: Docker数据卷"
    
    local volumes=$(docker volume ls --format "{{.Name}}" | grep learning-platform)
    if [ -n "$volumes" ]; then
        success "Docker数据卷存在"
        echo "   发现数据卷:"
        echo "$volumes" | sed 's/^/     - /'
    else
        fail "Docker数据卷不存在"
    fi
}

test_container_health() {
    log "测试容器健康状态..."
    
    local containers=("learning-platform-mysql" "learning-platform-redis" "learning-platform-backend" "learning-platform-frontend")
    
    for container in "${containers[@]}"; do
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        log "测试: $container 容器状态"
        
        local status=$(docker inspect --format="{{.State.Status}}" "$container" 2>/dev/null || echo "not_found")
        
        if [ "$status" = "running" ]; then
            success "$container 容器运行正常"
        else
            fail "$container 容器状态异常: $status"
        fi
    done
}

test_resource_usage() {
    log "测试资源使用情况..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "测试: 内存使用情况"
    
    local total_memory=$(docker stats --no-stream --format "{{.MemUsage}}" | grep -o '[0-9.]*GiB\|[0-9.]*MiB' | head -1)
    if [ -n "$total_memory" ]; then
        success "容器内存使用: $total_memory"
    else
        warn "无法获取内存使用信息"
    fi
}

test_logging() {
    log "测试日志功能..."
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "测试: 应用日志"
    
    local log_lines=$(docker-compose logs --tail=10 backend 2>/dev/null | wc -l)
    if [ "$log_lines" -gt 0 ]; then
        success "应用日志正常 ($log_lines 行)"
    else
        fail "应用日志异常"
    fi
}

show_summary() {
    echo ""
    echo "================================"
    echo -e "${BLUE}📊 测试结果汇总${NC}"
    echo "================================"
    echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"
    echo -e "成功率: ${BLUE}$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！系统运行正常。${NC}"
        return 0
    else
        echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败，请检查系统状态。${NC}"
        return 1
    fi
}

show_system_info() {
    echo ""
    echo "================================"
    echo -e "${BLUE}📋 系统信息${NC}"
    echo "================================"
    
    echo "Docker版本:"
    docker --version | sed 's/^/  /'
    
    echo ""
    echo "Docker Compose版本:"
    docker-compose --version 2>/dev/null | sed 's/^/  /' || docker compose version | sed 's/^/  /'
    
    echo ""
    echo "容器状态:"
    docker-compose ps | sed 's/^/  /'
    
    echo ""
    echo "网络状态:"
    docker network ls | grep learning-platform | sed 's/^/  /'
    
    echo ""
    echo "数据卷状态:"
    docker volume ls | grep learning-platform | sed 's/^/  /'
    
    echo ""
    echo "资源使用:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -5 | sed 's/^/  /'
}

# 主测试流程
main() {
    echo -e "${BLUE}"
    cat << "EOF"
🧪 铁路学习平台 Docker 部署测试
=====================================
EOF
    echo -e "${NC}"
    
    log "开始系统测试..."
    
    # 检查Docker Compose服务状态
    if ! docker-compose ps >/dev/null 2>&1; then
        error "Docker Compose服务未运行，请先启动服务"
        exit 1
    fi
    
    # 执行各项测试
    test_container_health
    test_database_connection
    test_redis_connection
    test_api_endpoints
    test_frontend
    test_data_persistence
    test_resource_usage
    test_logging
    
    # 显示系统信息
    show_system_info
    
    # 显示测试汇总
    show_summary
}

# 信号处理
trap 'error "测试中断"; exit 1' INT TERM

# 运行主函数
main "$@"
