#!/bin/bash

# 阿里云RDS访问诊断和修复脚本
# 用于检查和解决Navicat连接阿里云RDS的问题

echo "======================================"
echo "阿里云RDS连接诊断工具"
echo "======================================"
echo ""

# 配置信息
RDS_HOST="rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com"
RDS_PORT="3306"
RDS_USER="admin123"
RDS_PASS="Liao0820"
RDS_DB="learning_platform"
SERVER_IP="47.109.142.72"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印成功信息
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 函数：打印错误信息
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 函数：打印警告信息
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "[步骤1] 获取本机公网IP地址..."
echo "----------------------------------------"
MY_IP=$(curl -s ifconfig.me)
if [ -z "$MY_IP" ]; then
    MY_IP=$(curl -s ip.cn | grep -oP '(?<=IP：)[0-9.]+')
fi

if [ -z "$MY_IP" ]; then
    print_error "无法获取公网IP地址"
    echo "请手动访问 https://ip.cn 查看你的IP地址"
else
    print_success "你的公网IP地址是: $MY_IP"
fi
echo ""

echo "[步骤2] 测试网络连通性..."
echo "----------------------------------------"
echo "测试DNS解析..."
nslookup $RDS_HOST > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "DNS解析正常"
    RDS_RESOLVED_IP=$(nslookup $RDS_HOST | grep -A 1 "Name:" | grep "Address:" | awk '{print $2}')
    echo "   RDS解析到IP: $RDS_RESOLVED_IP"
else
    print_error "DNS解析失败"
fi

echo ""
echo "测试网络连通性..."
ping -c 2 -W 2 $RDS_HOST > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "网络连通性正常"
else
    print_warning "Ping测试失败（RDS可能禁用了ICMP）"
fi
echo ""

echo "[步骤3] 测试端口连接..."
echo "----------------------------------------"
# 使用nc或telnet测试端口
if command -v nc &> /dev/null; then
    timeout 3 nc -zv $RDS_HOST $RDS_PORT > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "端口3306可以访问"
    else
        print_error "端口3306无法访问（可能是白名单问题）"
    fi
elif command -v telnet &> /dev/null; then
    echo "quit" | timeout 3 telnet $RDS_HOST $RDS_PORT 2>&1 | grep -q "Connected"
    if [ $? -eq 0 ]; then
        print_success "端口3306可以访问"
    else
        print_error "端口3306无法访问（可能是白名单问题）"
    fi
else
    print_warning "没有安装nc或telnet，跳过端口测试"
fi
echo ""

echo "[步骤4] 测试MySQL连接..."
echo "----------------------------------------"
if command -v mysql &> /dev/null; then
    echo "尝试直接连接RDS..."
    mysql -h $RDS_HOST -u $RDS_USER -p$RDS_PASS -e "SELECT 'Direct connection SUCCESS' as Result;" 2>&1 | head -5
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_success "直接连接成功！"
    else
        print_error "直接连接失败"
        echo ""
        print_warning "错误原因分析："
        echo "1. IP地址 $MY_IP 未添加到RDS白名单"
        echo "2. 用户权限配置问题"
        echo "3. 网络防火墙拦截"
    fi
else
    print_warning "本地未安装mysql客户端，跳过直接连接测试"
fi
echo ""

echo "[步骤5] 通过服务器测试连接..."
echo "----------------------------------------"
echo "通过服务器 $SERVER_IP 连接RDS..."
ssh -o ConnectTimeout=5 root@$SERVER_IP << EOF 2>&1 | head -10
mysql -h $RDS_HOST -u $RDS_USER -p$RDS_PASS -e "SELECT 'Server connection SUCCESS' as Result; SHOW DATABASES;" 2>/dev/null
EOF

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "通过服务器连接成功！"
    echo ""
    print_warning "建议使用SSH隧道方式连接"
else
    print_error "服务器连接也失败"
fi
echo ""

echo "[步骤6] 解决方案建议..."
echo "=========================================="
echo ""
echo "📌 方案1: 添加IP白名单（需要登录阿里云控制台）"
echo "   1. 登录 https://rdsnext.console.aliyun.com"
echo "   2. 找到RDS实例: rm-cn-7js4el1by00015fo"
echo "   3. 进入【白名单配置】"
echo "   4. 添加你的IP: $MY_IP"
echo "   5. 或添加IP段: ${MY_IP%.*}.0/24"
echo ""
echo "📌 方案2: 使用SSH隧道（推荐，更安全）"
echo "   在Navicat中配置："
echo "   【常规】选项卡："
echo "     - 主机: localhost 或 127.0.0.1"
echo "     - 端口: 3306"
echo "     - 用户名: $RDS_USER"
echo "     - 密码: $RDS_PASS"
echo "   【SSH】选项卡："
echo "     - 勾选【使用SSH隧道】"
echo "     - SSH主机: $SERVER_IP"
echo "     - SSH端口: 22"
echo "     - 用户名: root"
echo "     - 密码: 你的服务器密码"
echo ""
echo "📌 方案3: 创建SSH端口转发（临时方案）"
echo "   在本地终端运行："
echo "   ssh -L 3307:$RDS_HOST:3306 root@$SERVER_IP -N"
echo "   然后在Navicat连接本地 127.0.0.1:3307"
echo ""
echo "=========================================="
echo ""

# 生成Navicat连接配置文件
echo "[步骤7] 生成Navicat连接配置..."
echo "----------------------------------------"
cat > navicat_rds_config.txt << EOF
=== Navicat连接配置信息 ===

直接连接配置（需要添加白名单）：
- 连接名: 学习平台RDS数据库
- 主机: $RDS_HOST
- 端口: $RDS_PORT
- 用户名: $RDS_USER
- 密码: $RDS_PASS
- 数据库: $RDS_DB

SSH隧道连接配置（推荐）：
【常规】选项卡:
- 连接名: 学习平台RDS数据库(SSH)
- 主机: localhost
- 端口: 3306
- 用户名: $RDS_USER
- 密码: $RDS_PASS
- 数据库: $RDS_DB

【SSH】选项卡:
- 使用SSH隧道: ✓
- SSH主机: $SERVER_IP
- SSH端口: 22
- 用户名: root
- 验证方法: 密码
- 密码: [你的服务器密码]

你的当前IP: $MY_IP
需要添加到白名单的IP: $MY_IP
EOF

print_success "配置信息已保存到 navicat_rds_config.txt"
echo ""

echo "诊断完成！"
echo "如需更多帮助，请查看 阿里云RDS连接Navicat解决方案.md"

