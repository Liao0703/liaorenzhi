#!/bin/bash

echo "🔧 配置防火墙..."

# 检测系统类型
if command -v ufw &> /dev/null; then
    echo "📦 Ubuntu/Debian 系统"
    # Ubuntu/Debian 防火墙配置
    ufw allow 3000/tcp
    ufw allow 22/tcp
    ufw --force enable
    echo "✅ UFW 防火墙配置完成"
elif command -v firewall-cmd &> /dev/null; then
    echo "📦 CentOS/RHEL 系统"
    # CentOS/RHEL 防火墙配置
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --reload
    echo "✅ Firewalld 防火墙配置完成"
else
    echo "⚠️  未检测到防火墙，请手动配置端口 3000"
fi

# 检查端口是否开放
if nc -z localhost 3000 2>/dev/null; then
    echo "✅ 端口 3000 已开放"
else
    echo "❌ 端口 3000 未开放"
fi
