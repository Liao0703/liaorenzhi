#!/bin/bash
# 第3步：配置Nginx反向代理（HTTP）
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 第3步：配置Nginx反向代理"
echo "========================================"

DOMAIN="api.liaorenzhi.top"
BACKEND_PORT="3001"

# 1. 检查Nginx是否运行
echo "🌐 检查Nginx服务状态..."
if ! sudo systemctl is-active --quiet nginx; then
    echo "❌ Nginx服务未运行，请先执行第1步"
    exit 1
fi
echo "✅ Nginx服务运行正常"

# 2. 检查后端服务是否运行
echo ""
echo "🟢 检查Node后端服务..."
if curl -s --connect-timeout 5 http://127.0.0.1:$BACKEND_PORT/health >/dev/null; then
    echo "✅ Node后端服务运行正常"
else
    echo "❌ Node后端服务未运行，请先执行第2步"
    echo "尝试访问: curl http://127.0.0.1:$BACKEND_PORT/health"
    exit 1
fi

# 3. 备份现有配置（如果存在）
echo ""
echo "💾 备份现有配置..."
NGINX_SITE="/etc/nginx/sites-available/$DOMAIN"
if [ -f "$NGINX_SITE" ]; then
    sudo cp "$NGINX_SITE" "$NGINX_SITE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ 已备份现有配置"
fi

# 4. 创建Nginx站点配置
echo ""
echo "⚙️  创建Nginx站点配置..."

sudo tee "$NGINX_SITE" > /dev/null << EOF
# Learning Platform API - Nginx配置
# 域名: $DOMAIN
# 后端: 127.0.0.1:$BACKEND_PORT
# 创建时间: $(date)

server {
    listen 80;
    server_name $DOMAIN;

    # 安全设置
    server_tokens off;
    
    # 客户端上传限制（与后端一致）
    client_max_body_size 50m;
    client_body_buffer_size 1m;
    client_body_timeout 60s;
    
    # 日志配置
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;

    # 主要API代理
    location / {
        # 代理到Node后端
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;

        # 基本代理头
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host \$server_name;

        # WebSocket支持（如需要）
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # 健康检查（可选：直接返回，减少后端负载）
    location = /health {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        
        # 健康检查快速响应
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # 禁止访问敏感文件
    location ~ /\\.ht {
        deny all;
    }
    
    location ~ /\\.(env|git) {
        deny all;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

echo "✅ Nginx站点配置已创建"

# 5. 启用站点
echo ""
echo "🔗 启用站点配置..."
sudo ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/$DOMAIN"
echo "✅ 站点配置已启用"

# 6. 测试Nginx配置语法
echo ""
echo "🔍 测试Nginx配置语法..."
if sudo nginx -t; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置语法错误，请检查配置文件"
    exit 1
fi

# 7. 重载Nginx配置
echo ""
echo "🔄 重载Nginx配置..."
sudo systemctl reload nginx
echo "✅ Nginx配置已重载"

# 8. 等待配置生效
echo ""
echo "⏳ 等待配置生效..."
sleep 3

# 9. 测试HTTP访问
echo ""
echo "🌐 测试HTTP访问..."

# 测试基本连接
echo "测试基本连接："
if curl -I -s --connect-timeout 10 "http://$DOMAIN" | head -n1; then
    echo "✅ HTTP连接正常"
else
    echo "❌ HTTP连接失败"
    echo "检查Nginx错误日志："
    sudo tail -10 /var/log/nginx/error.log
    exit 1
fi

# 测试健康检查
echo ""
echo "测试健康检查："
if curl -s --connect-timeout 10 "http://$DOMAIN/health"; then
    echo ""
    echo "✅ 健康检查正常"
else
    echo "❌ 健康检查失败"
    echo "检查后端日志和Nginx日志"
    exit 1
fi

# 10. 显示配置信息
echo ""
echo "📋 配置信息摘要："
echo "   - 域名: $DOMAIN"
echo "   - HTTP端口: 80"
echo "   - 后端代理: 127.0.0.1:$BACKEND_PORT"
echo "   - 配置文件: $NGINX_SITE"
echo "   - 访问日志: /var/log/nginx/$DOMAIN.access.log"
echo "   - 错误日志: /var/log/nginx/$DOMAIN.error.log"

# 11. 显示测试命令
echo ""
echo "🔧 验证命令："
echo "   curl -I http://$DOMAIN"
echo "   curl -s http://$DOMAIN/health"
echo "   curl -s http://$DOMAIN/api/cors-test"

echo ""
echo "========================================"
echo "✅ 第3步完成！Nginx反向代理配置成功"
echo ""
echo "📋 请执行以下命令验证配置："
echo "   1. dig +short $DOMAIN"
echo "   2. curl -s http://127.0.0.1:$BACKEND_PORT/health"
echo "   3. curl -I http://$DOMAIN"
echo "   4. curl -s http://$DOMAIN/health"
echo ""
echo "✅ 验证成功后，执行第4步：bash deploy-step4-https-cert.sh"
echo "========================================"
