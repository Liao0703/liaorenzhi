#!/bin/bash

# 宝塔面板网站空白页修复脚本
echo "🔧 宝塔面板网站空白页修复"
echo "=========================="
echo ""

# 服务器信息
SERVER="root@47.109.142.72"
BAOTA_PORT="8888"

echo "📋 常见的宝塔部署问题："
echo "1. 网站根目录设置错误"
echo "2. 运行目录未正确设置"
echo "3. 伪静态规则缺失"
echo "4. Node.js项目配置错误"
echo "5. 防跨站攻击(open_basedir)限制"
echo ""

# 创建宝塔配置修复文件
cat > /tmp/baota-fix-guide.txt << 'EOF'
=== 宝塔面板手动修复步骤 ===

1. 登录宝塔面板
   - 访问: http://47.109.142.72:8888
   - 使用管理员账号登录

2. 进入网站管理
   - 点击左侧菜单"网站"
   - 找到 47.109.142.72 网站
   - 点击"设置"

3. 检查网站根目录
   - 在"网站目录"标签页
   - 根目录应该是: /www/wwwroot/learning-platform 或 /www/wwwroot/47.109.142.72
   - 运行目录设置为: /dist

4. 配置伪静态（重要！）
   - 点击"伪静态"标签页
   - 选择或输入以下规则：

location / {
    try_files $uri $uri/ /index.html;
}

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
}

location /health {
    proxy_pass http://127.0.0.1:3001/health;
}

5. 检查防跨站设置
   - 在"网站目录"标签页
   - 关闭"防跨站攻击(open_basedir)"选项

6. 检查Node.js项目
   - 点击左侧菜单"Node项目"
   - 确保项目已启动并运行在3001端口
   - 如果没有，需要添加Node项目：
     * 项目路径: /www/wwwroot/learning-platform
     * 启动文件: server/app.js 或 ecosystem.config.js
     * 端口: 3001

7. 检查PM2进程
   - 在SSH终端执行: pm2 list
   - 确保有进程在运行

8. 清理并重启
   - 在宝塔面板点击"重启"按钮重启网站
   - 或在SSH执行: nginx -s reload
EOF

echo "📝 已生成修复指南: /tmp/baota-fix-guide.txt"
echo ""

# 创建自动检查脚本
cat > /tmp/check-baota-site.sh << 'EOF'
#!/bin/bash
# 宝塔网站检查脚本

echo "🔍 检查宝塔网站配置..."

# 1. 检查网站目录
echo ""
echo "1. 检查网站目录："
for dir in /www/wwwroot/learning-platform /www/wwwroot/47.109.142.72; do
    if [ -d "$dir" ]; then
        echo "✓ 找到目录: $dir"
        echo "  内容："
        ls -la "$dir" | head -5
        
        if [ -d "$dir/dist" ]; then
            echo "✓ dist目录存在"
            if [ -f "$dir/dist/index.html" ]; then
                echo "✓ index.html存在"
            else
                echo "✗ index.html不存在"
            fi
        else
            echo "✗ dist目录不存在"
        fi
    fi
done

# 2. 检查Nginx配置
echo ""
echo "2. 检查Nginx配置："
NGINX_CONF="/www/server/panel/vhost/nginx/47.109.142.72.conf"
if [ -f "$NGINX_CONF" ]; then
    echo "✓ 配置文件存在: $NGINX_CONF"
    echo "  关键配置："
    grep -E "root|location|try_files|proxy_pass" "$NGINX_CONF" | head -20
else
    echo "✗ 配置文件不存在"
fi

# 3. 检查Node.js进程
echo ""
echo "3. 检查Node.js进程："
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "✗ PM2未安装"
fi

# 4. 检查端口
echo ""
echo "4. 检查端口监听："
netstat -tlnp | grep -E ":80|:3001|:3002" || ss -tlnp | grep -E ":80|:3001|:3002"

# 5. 测试访问
echo ""
echo "5. 测试网站访问："
curl -I http://localhost/
curl -s http://localhost/health

echo ""
echo "✅ 检查完成"
EOF

# 创建快速修复脚本
cat > /tmp/quick-fix-baota.sh << 'EOF'
#!/bin/bash
# 宝塔快速修复脚本

echo "🚀 开始快速修复..."

# 1. 确定网站目录
SITE_DIR=""
if [ -d "/www/wwwroot/learning-platform" ]; then
    SITE_DIR="/www/wwwroot/learning-platform"
elif [ -d "/www/wwwroot/47.109.142.72" ]; then
    SITE_DIR="/www/wwwroot/47.109.142.72"
else
    echo "❌ 未找到网站目录"
    exit 1
fi

echo "✓ 使用网站目录: $SITE_DIR"

# 2. 检查dist目录
if [ ! -d "$SITE_DIR/dist" ]; then
    echo "❌ dist目录不存在，需要编译前端"
    echo "请在本地执行 npm run build 然后上传dist目录"
    exit 1
fi

# 3. 修复权限
echo "修复文件权限..."
chown -R www:www "$SITE_DIR"
chmod -R 755 "$SITE_DIR"

# 4. 创建正确的Nginx配置
echo "更新Nginx配置..."
cat > /www/server/panel/vhost/nginx/47.109.142.72.conf << NGINX_EOF
server {
    listen 80;
    server_name 47.109.142.72;
    index index.html index.htm;
    root $SITE_DIR/dist;
    
    # 日志
    access_log /www/wwwlogs/47.109.142.72.log;
    error_log /www/wwwlogs/47.109.142.72.error.log;
    
    # 前端路由 - 关键配置
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
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
    
    # 防止访问隐藏文件
    location ~ /\. {
        deny all;
    }
    
    # 宝塔面板相关配置
    include enable-php-00.conf;
}
NGINX_EOF

# 5. 测试Nginx配置
nginx -t

# 6. 重启Nginx
echo "重启Nginx..."
/etc/init.d/nginx reload || systemctl reload nginx

# 7. 检查Node.js服务
echo ""
echo "检查Node.js服务..."
if ! pm2 list | grep -q "online"; then
    echo "Node.js服务未运行，尝试启动..."
    cd "$SITE_DIR"
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    elif [ -f "server/app.js" ]; then
        pm2 start server/app.js --name learning-platform
    else
        echo "❌ 未找到启动文件"
    fi
fi

echo ""
echo "✅ 修复完成！"
echo "请访问: http://47.109.142.72"
EOF

echo ""
echo "🔧 修复方案："
echo "============"
echo ""
echo "方案1: 手动修复（推荐）"
echo "  查看详细步骤: cat /tmp/baota-fix-guide.txt"
echo ""
echo "方案2: SSH自动修复"
echo "  1. 复制脚本到服务器："
echo "     scp /tmp/check-baota-site.sh /tmp/quick-fix-baota.sh $SERVER:/tmp/"
echo ""
echo "  2. 登录服务器执行："
echo "     ssh $SERVER"
echo "     bash /tmp/check-baota-site.sh  # 先检查"
echo "     bash /tmp/quick-fix-baota.sh   # 再修复"
echo ""
echo "方案3: 最可能的问题"
echo "  宝塔面板中网站的'运行目录'可能设置错误"
echo "  正确设置: /dist"
echo ""
echo "💡 提示："
echo "1. 确保在宝塔面板中网站运行目录设置为 /dist"
echo "2. 确保伪静态规则包含 try_files \$uri \$uri/ /index.html;"
echo "3. 确保Node.js项目在PM2中正常运行"
echo ""
echo "📱 宝塔面板地址: http://47.109.142.72:8888"




