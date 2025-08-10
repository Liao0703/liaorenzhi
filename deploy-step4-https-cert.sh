#!/bin/bash
# 第4步：申请HTTPS证书（Certbot自动配置）
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 第4步：申请HTTPS证书"
echo "========================================"

DOMAIN="api.liaorenzhi.top"
EMAIL_PLACEHOLDER="your-email@example.com"

# 1. 检查前置条件
echo "🔍 检查前置条件..."

# 检查Nginx是否运行
if ! sudo systemctl is-active --quiet nginx; then
    echo "❌ Nginx服务未运行，请先完成前3步"
    exit 1
fi

# 检查域名HTTP访问
if ! curl -I -s --connect-timeout 10 "http://$DOMAIN" >/dev/null; then
    echo "❌ HTTP访问失败，请确认第3步配置正确"
    echo "测试命令: curl -I http://$DOMAIN"
    exit 1
fi

echo "✅ 前置条件检查通过"

# 2. 询问邮箱地址
echo ""
echo "📧 配置邮箱地址..."
echo "请输入用于SSL证书通知的邮箱地址（按Enter使用示例邮箱）："
read -p "邮箱地址 [$EMAIL_PLACEHOLDER]: " USER_EMAIL
EMAIL=${USER_EMAIL:-$EMAIL_PLACEHOLDER}

if [[ "$EMAIL" == "$EMAIL_PLACEHOLDER" ]]; then
    echo "⚠️  使用示例邮箱，建议使用真实邮箱以接收证书过期通知"
fi

echo "使用邮箱: $EMAIL"

# 3. 安装snapd（如果未安装）
echo ""
echo "📦 检查并安装snapd..."
if ! command -v snap >/dev/null 2>&1; then
    echo "安装snapd..."
    sudo apt update
    sudo apt install -y snapd
    echo "✅ snapd安装完成"
else
    echo "✅ snapd已安装"
fi

# 确保snapd服务运行
sudo systemctl enable --now snapd.socket

# 4. 安装certbot
echo ""
echo "🔐 安装Certbot..."

# 更新snap core
sudo snap install core
sudo snap refresh core

# 检查是否已安装certbot
if command -v certbot >/dev/null 2>&1; then
    echo "✅ Certbot已安装：$(certbot --version | head -n1)"
else
    # 安装certbot
    sudo snap install --classic certbot
    
    # 创建符号链接
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
    echo "✅ Certbot安装完成"
fi

# 5. 申请SSL证书
echo ""
echo "🔒 申请SSL证书..."
echo "域名: $DOMAIN"
echo "邮箱: $EMAIL"

# 使用certbot nginx插件自动配置
echo "开始申请证书（这可能需要几分钟）..."

sudo certbot --nginx \
    -d "$DOMAIN" \
    --redirect \
    -m "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --no-eff-email

echo "✅ SSL证书申请完成"

# 6. 验证HTTPS访问
echo ""
echo "🔍 验证HTTPS访问..."
sleep 3

# 测试HTTPS连接
echo "测试HTTPS连接："
if curl -I -s --connect-timeout 15 "https://$DOMAIN" | head -n1; then
    echo "✅ HTTPS连接正常"
else
    echo "❌ HTTPS连接失败"
    echo "检查Nginx配置和证书状态"
    sudo nginx -t
    exit 1
fi

# 测试HTTPS健康检查
echo ""
echo "测试HTTPS健康检查："
if curl -s --connect-timeout 15 "https://$DOMAIN/health"; then
    echo ""
    echo "✅ HTTPS健康检查正常"
else
    echo "❌ HTTPS健康检查失败"
    exit 1
fi

# 7. 检查HTTP重定向
echo ""
echo "🔄 检查HTTP到HTTPS重定向..."
HTTP_REDIRECT=$(curl -I -s --connect-timeout 10 "http://$DOMAIN" | grep -i "location:" | head -n1)
if echo "$HTTP_REDIRECT" | grep -q "https://"; then
    echo "✅ HTTP自动重定向到HTTPS正常"
    echo "重定向: $HTTP_REDIRECT"
else
    echo "⚠️  HTTP重定向可能未配置"
fi

# 8. 显示证书信息
echo ""
echo "📜 证书信息："
sudo certbot certificates | grep -A 10 "$DOMAIN" || echo "证书列表获取失败"

# 9. 检查证书文件
echo ""
echo "📁 证书文件位置："
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
if [ -d "$CERT_PATH" ]; then
    echo "✅ 证书目录: $CERT_PATH"
    ls -la "$CERT_PATH"
else
    echo "❌ 证书目录不存在: $CERT_PATH"
fi

# 10. 显示Nginx配置变化
echo ""
echo "⚙️  查看Nginx配置更新..."
echo "Certbot已自动更新Nginx配置文件："
echo "/etc/nginx/sites-available/$DOMAIN"

# 显示更新后的配置片段
echo ""
echo "主要配置变化："
grep -A 5 -B 5 "443\|ssl" "/etc/nginx/sites-available/$DOMAIN" | head -20

echo ""
echo "========================================"
echo "✅ 第4步完成！HTTPS证书配置成功"
echo ""
echo "🔧 验证命令："
echo "   curl -I https://$DOMAIN"
echo "   curl -s https://$DOMAIN/health"
echo "   curl -I http://$DOMAIN  # 应重定向到HTTPS"
echo ""
echo "📋 证书信息："
echo "   域名: $DOMAIN"
echo "   颁发者: Let's Encrypt"
echo "   邮箱: $EMAIL"
echo "   自动续期: 已配置"
echo ""
echo "📋 下一步：执行 bash deploy-step5-auto-renew.sh"
echo "========================================"
