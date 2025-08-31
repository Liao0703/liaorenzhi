#!/bin/bash

# 快速修复Nginx 404错误脚本
# 适用于宝塔面板环境
# 服务器: 47.109.142.72

echo "======================================"
echo "快速修复Nginx 404错误"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置变量
PROJECT_PATH="/www/wwwroot/learning-platform"
NGINX_CONF_PATH="/www/server/panel/vhost/nginx/47.109.142.72.conf"
BACKUP_DIR="/root/nginx-backup"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}[1] 备份当前配置${NC}"
if [ -f "$NGINX_CONF_PATH" ]; then
    cp "$NGINX_CONF_PATH" "$BACKUP_DIR/47.109.142.72.conf.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ 配置已备份到: $BACKUP_DIR${NC}"
else
    echo -e "${RED}❌ 配置文件不存在: $NGINX_CONF_PATH${NC}"
fi

echo -e "\n${YELLOW}[2] 创建项目目录结构${NC}"
mkdir -p "$PROJECT_PATH/dist"
mkdir -p "$PROJECT_PATH/server"
mkdir -p "$PROJECT_PATH/server/uploads"
mkdir -p "$PROJECT_PATH/php-backend"
echo -e "${GREEN}✅ 目录结构已创建${NC}"

echo -e "\n${YELLOW}[3] 生成正确的Nginx配置${NC}"
cat > "$NGINX_CONF_PATH" << 'EOF'
server {
    listen 80;
    server_name 47.109.142.72;
    root /www/wwwroot/learning-platform;
    index index.html index.htm;
    
    # 日志配置
    error_log /www/wwwlogs/learning-platform.error.log;
    access_log /www/wwwlogs/learning-platform.access.log;

    # 前端React应用
    location / {
        root /www/wwwroot/learning-platform/dist;
        try_files $uri $uri/ /index.html;
        
        # 修复JavaScript MIME类型
        location ~* \.js$ {
            add_header Content-Type "text/javascript; charset=UTF-8";
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # CSS MIME类型
        location ~* \.css$ {
            add_header Content-Type "text/css; charset=UTF-8";
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # 图片和字体缓存
        location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理到Node.js后端
    location ^~ /api/ {
        # 先尝试3001端口
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS处理
        add_header Access-Control-Allow-Origin "$http_origin" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 健康检查端点
    location = /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # 文件上传目录
    location ^~ /uploads/ {
        alias /www/wwwroot/learning-platform/server/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # favicon处理
    location = /favicon.ico {
        root /www/wwwroot/learning-platform/dist;
        log_not_found off;
        access_log off;
    }

    # robots.txt处理
    location = /robots.txt {
        root /www/wwwroot/learning-platform/dist;
        log_not_found off;
        access_log off;
    }

    # 安全配置
    location ~ /\.(env|git|gitignore|htaccess) {
        deny all;
        return 404;
    }
    
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 禁止访问备份文件
    location ~* \.(bak|backup|old|orig|original|~)$ {
        deny all;
        return 404;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/x-js text/x-cross-domain-policy application/x-font-ttf application/x-font-opentype application/vnd.ms-fontobject image/x-icon;
}
EOF

echo -e "${GREEN}✅ Nginx配置已更新${NC}"

echo -e "\n${YELLOW}[4] 测试Nginx配置${NC}"
nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx配置语法正确${NC}"
else
    echo -e "${RED}❌ Nginx配置有错误，恢复备份${NC}"
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/47.109.142.72.conf.* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" "$NGINX_CONF_PATH"
        echo -e "${YELLOW}已恢复到备份配置${NC}"
    fi
    exit 1
fi

echo -e "\n${YELLOW}[5] 设置文件权限${NC}"
chown -R www:www "$PROJECT_PATH"
chmod -R 755 "$PROJECT_PATH"
chmod -R 777 "$PROJECT_PATH/server/uploads" 2>/dev/null || true
echo -e "${GREEN}✅ 权限设置完成${NC}"

echo -e "\n${YELLOW}[6] 创建测试文件${NC}"
if [ ! -f "$PROJECT_PATH/dist/index.html" ]; then
    cat > "$PROJECT_PATH/dist/index.html" << 'HTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>学习平台 - 维护中</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.9; }
        .status { 
            margin-top: 2rem; 
            padding: 1rem; 
            background: rgba(255, 255, 255, 0.2); 
            border-radius: 5px;
        }
        .success { color: #4ade80; }
        .error { color: #f87171; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚧 系统维护中</h1>
        <p>网站正在进行维护升级，请稍后访问</p>
        <div class="status">
            <p class="success">✅ Nginx配置已修复</p>
            <p>⏳ 等待前端文件部署...</p>
        </div>
    </div>
</body>
</html>
HTML
    echo -e "${GREEN}✅ 创建了临时首页${NC}"
fi

echo -e "\n${YELLOW}[7] 重载Nginx服务${NC}"
nginx -s reload
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx已重新加载${NC}"
else
    echo -e "${RED}❌ Nginx重载失败${NC}"
    systemctl restart nginx
fi

echo -e "\n${YELLOW}[8] 检查Node.js后端${NC}"
# 检查3001端口
if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
    echo -e "${GREEN}✅ Node.js后端正在3001端口运行${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js后端未在3001端口运行${NC}"
    
    # 尝试启动Node.js后端
    if [ -f "$PROJECT_PATH/server/app.js" ]; then
        echo "尝试启动Node.js后端..."
        cd "$PROJECT_PATH/server"
        
        # 检查PM2
        if command -v pm2 &> /dev/null; then
            pm2 start app.js --name learning-platform
            pm2 save
            echo -e "${GREEN}✅ 使用PM2启动了Node.js后端${NC}"
        else
            # 使用nohup启动
            nohup node app.js > /var/log/learning-platform.log 2>&1 &
            echo -e "${GREEN}✅ 使用nohup启动了Node.js后端${NC}"
        fi
    else
        echo -e "${RED}❌ Node.js后端文件不存在${NC}"
        echo "需要上传server目录文件"
    fi
fi

echo -e "\n${YELLOW}[9] 清理缓存${NC}"
# 清理Nginx缓存
rm -rf /var/cache/nginx/* 2>/dev/null
# 清理浏览器缓存提示
echo -e "${YELLOW}请在浏览器中清理缓存或使用隐私模式访问${NC}"

echo -e "\n${GREEN}======================================"
echo "修复完成！"
echo "======================================${NC}"
echo ""
echo "访问测试："
echo "1. 网站首页: http://47.109.142.72"
echo "2. 健康检查: http://47.109.142.72/health"
echo "3. API测试: http://47.109.142.72/api/health"
echo ""
echo "查看日志："
echo "- Nginx错误日志: tail -f /www/wwwlogs/learning-platform.error.log"
echo "- 访问日志: tail -f /www/wwwlogs/learning-platform.access.log"
echo ""
echo "如果还有问题："
echo "1. 检查前端文件是否已上传到: $PROJECT_PATH/dist/"
echo "2. 检查Node.js后端是否运行: pm2 list"
echo "3. 查看防火墙设置: firewall-cmd --list-all"
echo ""
echo -e "${YELLOW}配置已备份在: $BACKUP_DIR${NC}"





