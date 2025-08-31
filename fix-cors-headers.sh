#!/bin/bash

# 修复CORS和安全头问题
echo "🔧 修复网站安全头配置问题"
echo "========================"

SERVER="root@47.109.142.72"

# 创建临时的nginx配置修复
cat > /tmp/nginx-fix-headers.conf << 'EOF'
server {
    listen 80;
    server_name 47.109.142.72;
    root /www/wwwroot/learning-platform/dist;
    index index.html index.htm;
    
    # 日志文件
    access_log /www/wwwlogs/47.109.142.72.log;
    error_log /www/wwwlogs/47.109.142.72.error.log;

    # 修改安全头配置，解决COOP警告
    # 移除或调整导致问题的头
    # add_header Cross-Origin-Opener-Policy "unsafe-none" always;
    add_header Cross-Origin-Embedder-Policy "unsafe-none" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 为静态资源添加正确的MIME类型
    location ~* \.(js)$ {
        add_header Content-Type "application/javascript; charset=utf-8" always;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        expires 1y;
    }
    
    location ~* \.(css)$ {
        add_header Content-Type "text/css; charset=utf-8" always;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        expires 1y;
    }
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
        
        # HTML文件不缓存
        location ~* \.(html)$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate" always;
            add_header Pragma "no-cache" always;
            expires 0;
        }
    }
    
    # API代理
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
    
    # favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
EOF

echo "📋 修复步骤："
echo "1. 将此配置上传到服务器"
echo "2. 备份现有配置"
echo "3. 应用新配置"
echo "4. 重启Nginx"
echo ""

# 询问是否有SSH密码
echo "请输入服务器SSH密码（如果需要）："
read -s SSH_PASS

if [ ! -z "$SSH_PASS" ]; then
    # 使用sshpass
    if ! command -v sshpass &> /dev/null; then
        echo "安装sshpass..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install hudochenkov/sshpass/sshpass 2>/dev/null || echo "请手动安装sshpass"
        fi
    fi
    
    # 上传配置
    echo ""
    echo "📤 上传配置文件..."
    sshpass -p "$SSH_PASS" scp /tmp/nginx-fix-headers.conf $SERVER:/tmp/
    
    # 执行修复
    echo "🔧 执行修复..."
    sshpass -p "$SSH_PASS" ssh $SERVER << 'REMOTE_SCRIPT'
# 备份当前配置
echo "备份当前配置..."
if [ -f /www/server/panel/vhost/nginx/47.109.142.72.conf ]; then
    cp /www/server/panel/vhost/nginx/47.109.142.72.conf /www/server/panel/vhost/nginx/47.109.142.72.conf.backup-$(date +%Y%m%d-%H%M%S)
fi

# 应用新配置
echo "应用新配置..."
cp /tmp/nginx-fix-headers.conf /www/server/panel/vhost/nginx/47.109.142.72.conf

# 测试配置
echo "测试Nginx配置..."
nginx -t

# 重启Nginx
echo "重启Nginx..."
service nginx restart || systemctl restart nginx

echo "✅ 配置已更新"
REMOTE_SCRIPT
    
else
    echo ""
    echo "⚠️  请手动执行以下步骤："
    echo ""
    echo "1. 复制配置文件到服务器："
    echo "   scp /tmp/nginx-fix-headers.conf $SERVER:/tmp/"
    echo ""
    echo "2. SSH登录服务器："
    echo "   ssh $SERVER"
    echo ""
    echo "3. 备份并应用配置："
    echo "   cp /www/server/panel/vhost/nginx/47.109.142.72.conf /www/server/panel/vhost/nginx/47.109.142.72.conf.backup"
    echo "   cp /tmp/nginx-fix-headers.conf /www/server/panel/vhost/nginx/47.109.142.72.conf"
    echo ""
    echo "4. 测试并重启Nginx："
    echo "   nginx -t"
    echo "   service nginx restart"
fi

echo ""
echo "✅ 修复完成后，请："
echo "1. 清除浏览器缓存"
echo "2. 使用无痕/隐私模式访问"
echo "3. 访问 http://47.109.142.72"
echo ""
echo "💡 如果仍有问题，请检查："
echo "- 浏览器控制台是否还有错误"
echo "- 尝试其他浏览器（Chrome/Firefox/Safari）"
echo "- 检查本地网络连接"




