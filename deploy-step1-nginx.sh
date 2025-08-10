#!/bin/bash
# 第1步：安装Nginx
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 第1步：安装Nginx"
echo "========================================"

# 1. 更新包管理器
echo "📦 更新包管理器..."
sudo apt update

# 2. 安装Nginx
echo ""
echo "🌐 安装Nginx..."
if command -v nginx >/dev/null 2>&1; then
    echo "✅ Nginx已安装，版本："
    nginx -v
else
    sudo apt install -y nginx
    echo "✅ Nginx安装完成"
fi

# 3. 启用并启动Nginx服务
echo ""
echo "🚀 启用并启动Nginx服务..."
sudo systemctl enable nginx
sudo systemctl start nginx

# 4. 检查Nginx状态
echo ""
echo "📊 检查Nginx服务状态..."
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx服务运行正常"
    sudo systemctl status nginx --no-pager -l
else
    echo "❌ Nginx服务启动失败"
    sudo systemctl status nginx --no-pager -l
    exit 1
fi

# 5. 验证Nginx是否响应
echo ""
echo "🔍 测试Nginx HTTP响应..."
if curl -I -s --connect-timeout 5 http://localhost | head -n1; then
    echo "✅ Nginx HTTP响应正常"
else
    echo "❌ Nginx HTTP响应失败"
    exit 1
fi

# 6. 删除默认站点（避免冲突）
echo ""
echo "🗑️  清理默认站点配置..."
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
    echo "✅ 已删除默认站点配置"
else
    echo "ℹ️  默认站点配置不存在"
fi

# 7. 检查Nginx配置语法
echo ""
echo "⚙️  检查Nginx配置语法..."
if sudo nginx -t; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置语法错误"
    exit 1
fi

# 8. 重载Nginx配置
echo ""
echo "🔄 重载Nginx配置..."
sudo systemctl reload nginx
echo "✅ Nginx配置已重载"

# 9. 显示Nginx信息
echo ""
echo "📋 Nginx安装信息："
echo "   - 版本：$(nginx -v 2>&1)"
echo "   - 配置目录：/etc/nginx/"
echo "   - 站点配置：/etc/nginx/sites-available/"
echo "   - 启用站点：/etc/nginx/sites-enabled/"
echo "   - 日志目录：/var/log/nginx/"
echo "   - 默认根目录：/var/www/html/"

echo ""
echo "========================================"
echo "✅ 第1步完成！Nginx安装和配置成功"
echo ""
echo "📋 下一步：执行 bash deploy-step2-node-backend.sh"
echo "========================================"
