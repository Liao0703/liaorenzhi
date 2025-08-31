#!/bin/bash

# 修复Nginx重复location配置问题
echo "🔧 修复Nginx配置冲突"
echo "==================="
echo ""
echo "错误原因：配置文件中有重复的 location / 规则"
echo "文件：/www/server/panel/vhost/nginx/node_learning_platform.conf"
echo ""

# 创建正确的配置文件
cat > /tmp/node_learning_platform_fixed.conf << 'EOF'
server {
    listen 80;
    server_name 47.109.142.72;
    index index.html index.htm;
    root /www/wwwroot/learning-platform/dist;
    
    # 错误日志
    error_log /www/wwwlogs/47.109.142.72.error.log;
    access_log /www/wwwlogs/47.109.142.72.log;
    
    # 防止访问隐藏文件
    location ~ /\. {
        deny all;
    }
    
    # API代理 - 必须放在 location / 之前
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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # 健康检查
    location = /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 前端路由 - 这必须是最后一个location规则
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 禁止访问的文件类型
    location ~* \.(sql|log|conf|bak|ini)$ {
        deny all;
    }
    
    # Gzip压缩
    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 6;
    gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript;
    gzip_vary on;
    gzip_disable "MSIE [1-6]\.";
}
EOF

echo "📝 宝塔面板手动修复步骤："
echo "========================"
echo ""
echo "1. 登录宝塔面板"
echo "   http://47.109.142.72:8888"
echo ""
echo "2. 找到网站配置"
echo "   网站 → 47.109.142.72 → 设置 → 配置文件"
echo ""
echo "3. 检查重复的location配置"
echo "   查找是否有多个 location / { ... } 块"
echo ""
echo "4. 使用以下规则替换整个配置："
echo ""
cat /tmp/node_learning_platform_fixed.conf
echo ""
echo "5. 或者在伪静态中只添加："
echo "location / {"
echo "    try_files \$uri \$uri/ /index.html;"
echo "}"
echo ""
echo "⚠️  注意事项："
echo "- 不要在'配置文件'和'伪静态'中同时配置相同的location"
echo "- 宝塔可能会自动添加一些location规则"
echo "- 如果使用'伪静态'功能，就不要在'配置文件'中重复添加"
echo ""

# 创建最简化的伪静态规则
cat > /tmp/simple-rewrite.conf << 'EOF'
# 这是最简化的伪静态规则，只放在宝塔的"伪静态"设置中
# 不要放在配置文件中

# API代理
location ^~ /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# 健康检查
location = /health {
    proxy_pass http://127.0.0.1:3001/health;
}

# 前端路由
location / {
    try_files $uri $uri/ /index.html;
}
EOF

echo "💡 最简单的解决方案："
echo "==================="
echo ""
echo "1. 在宝塔面板中清空'配置文件'的自定义内容"
echo ""
echo "2. 只在'伪静态'标签页中添加："
echo ""
cat /tmp/simple-rewrite.conf
echo ""
echo "3. 保存并重启网站"
echo ""
echo "🔍 调试命令："
echo "ssh root@47.109.142.72"
echo "# 查看当前配置"
echo "cat /www/server/panel/vhost/nginx/node_learning_platform.conf"
echo "# 测试配置"
echo "nginx -t"
echo "# 查看错误日志"
echo "tail -f /www/wwwlogs/47.109.142.72.error.log"




