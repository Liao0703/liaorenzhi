#!/bin/bash
# 第0步：DNS与端口确认
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 第0步：DNS与端口确认"
echo "========================================"

# 1. 确认DNS解析
echo "🌐 检查DNS解析..."
DNS_IP=$(dig +short api.liaorenzhi.top | tail -n1)
if [ -z "$DNS_IP" ]; then
    echo "❌ DNS解析失败！请确认域名 api.liaorenzhi.top 已正确指向服务器IP"
    echo "请在域名管理后台添加A记录：api.liaorenzhi.top -> 你的服务器公网IP"
    exit 1
else
    echo "✅ DNS解析成功：api.liaorenzhi.top -> $DNS_IP"
fi

# 2. 获取当前服务器IP进行对比
echo ""
echo "🖥️  获取服务器公网IP..."
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || curl -s icanhazip.com)
if [ -n "$SERVER_IP" ]; then
    echo "✅ 服务器公网IP：$SERVER_IP"
    if [ "$DNS_IP" = "$SERVER_IP" ]; then
        echo "✅ DNS解析正确匹配服务器IP"
    else
        echo "⚠️  DNS解析IP ($DNS_IP) 与服务器IP ($SERVER_IP) 不匹配"
        echo "请检查域名解析配置是否正确"
    fi
else
    echo "⚠️  无法获取服务器公网IP，请手动验证"
fi

# 3. 放通防火墙端口
echo ""
echo "🔥 配置防火墙端口..."

# 检查是否已安装ufw
if command -v ufw >/dev/null 2>&1; then
    # 放通HTTP/HTTPS端口
    sudo ufw allow 'Nginx Full' 2>/dev/null || true
    sudo ufw allow 80/tcp 2>/dev/null || true
    sudo ufw allow 443/tcp 2>/dev/null || true
    echo "✅ UFW防火墙已配置（80/443端口）"
    
    # 显示当前规则
    echo "当前UFW规则："
    sudo ufw status numbered 2>/dev/null || echo "UFW未启用或无规则"
else
    echo "⚠️  UFW未安装，跳过本地防火墙配置"
fi

# 4. 检查端口占用
echo ""
echo "🔍 检查端口占用情况..."

check_port() {
    local port=$1
    local service=$2
    if ss -tulpn | grep ":$port " >/dev/null 2>&1; then
        echo "✅ 端口 $port 已被占用（$service）"
        ss -tulpn | grep ":$port "
    else
        echo "🆓 端口 $port 空闲（将用于$service）"
    fi
}

check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3001 "Node.js后端"

echo ""
echo "========================================"
echo "✅ 第0步完成！DNS和端口检查总结："
echo "   - DNS解析：api.liaorenzhi.top -> $DNS_IP"
echo "   - 防火墙：已配置HTTP/HTTPS端口"
echo "   - 端口检查：已完成"
echo ""
echo "📋 下一步：执行 bash deploy-step1-nginx.sh"
echo "========================================"
