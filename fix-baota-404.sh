#!/bin/bash

# 宝塔404错误修复脚本
# 服务器: 47.109.142.72
# 用于修复宝塔面板和网站404错误

echo "======================================"
echo "宝塔404错误诊断和修复脚本"
echo "服务器: 47.109.142.72"
echo "======================================"

# 在服务器上执行此脚本
# 使用方法: bash fix-baota-404.sh

# 设置变量
PROJECT_PATH="/www/wwwroot/learning-platform"
BAOTA_PANEL_PORT="8888"  # 宝塔面板默认端口
WEBSITE_DOMAIN="47.109.142.72"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}[步骤1] 检查系统服务状态${NC}"
echo "======================================"

# 检查nginx状态
echo -e "\n检查Nginx服务..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx服务正在运行${NC}"
    nginx -v 2>&1
else
    echo -e "${RED}❌ Nginx服务未运行${NC}"
    echo "尝试启动Nginx..."
    systemctl start nginx
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx已成功启动${NC}"
    else
        echo -e "${RED}❌ Nginx启动失败，请检查配置${NC}"
        nginx -t
    fi
fi

# 检查宝塔面板服务
echo -e "\n检查宝塔面板服务..."
if ps aux | grep -q "[b]t.py"; then
    echo -e "${GREEN}✅ 宝塔面板正在运行${NC}"
else
    echo -e "${RED}❌ 宝塔面板未运行${NC}"
    echo "尝试重启宝塔面板..."
    /etc/init.d/bt restart
fi

echo -e "\n${YELLOW}[步骤2] 检查网站配置${NC}"
echo "======================================"

# 检查项目目录
echo -e "\n检查项目目录..."
if [ -d "$PROJECT_PATH" ]; then
    echo -e "${GREEN}✅ 项目目录存在: $PROJECT_PATH${NC}"
    
    # 检查关键文件
    echo "检查关键文件..."
    if [ -d "$PROJECT_PATH/dist" ]; then
        echo -e "${GREEN}✅ 前端dist目录存在${NC}"
        ls -la "$PROJECT_PATH/dist/" | head -5
    else
        echo -e "${RED}❌ 前端dist目录不存在${NC}"
        echo "需要构建或上传前端文件到: $PROJECT_PATH/dist/"
    fi
    
    if [ -d "$PROJECT_PATH/server" ]; then
        echo -e "${GREEN}✅ 后端server目录存在${NC}"
    else
        echo -e "${YELLOW}⚠️  后端server目录不存在${NC}"
    fi
    
    if [ -d "$PROJECT_PATH/php-backend" ]; then
        echo -e "${GREEN}✅ PHP后端目录存在${NC}"
    else
        echo -e "${YELLOW}⚠️  PHP后端目录不存在${NC}"
    fi
else
    echo -e "${RED}❌ 项目目录不存在: $PROJECT_PATH${NC}"
    echo "创建项目目录..."
    mkdir -p "$PROJECT_PATH/dist"
    mkdir -p "$PROJECT_PATH/server"
    mkdir -p "$PROJECT_PATH/php-backend"
fi

echo -e "\n${YELLOW}[步骤3] 检查Nginx配置${NC}"
echo "======================================"

# 查找网站配置文件
NGINX_CONF=""
if [ -f "/www/server/panel/vhost/nginx/${WEBSITE_DOMAIN}.conf" ]; then
    NGINX_CONF="/www/server/panel/vhost/nginx/${WEBSITE_DOMAIN}.conf"
elif [ -f "/www/server/nginx/conf/vhost/${WEBSITE_DOMAIN}.conf" ]; then
    NGINX_CONF="/www/server/nginx/conf/vhost/${WEBSITE_DOMAIN}.conf"
elif [ -f "/etc/nginx/sites-enabled/${WEBSITE_DOMAIN}.conf" ]; then
    NGINX_CONF="/etc/nginx/sites-enabled/${WEBSITE_DOMAIN}.conf"
fi

if [ -n "$NGINX_CONF" ]; then
    echo -e "${GREEN}✅ 找到Nginx配置文件: $NGINX_CONF${NC}"
    echo "当前配置内容（前20行）:"
    head -20 "$NGINX_CONF"
    
    # 检查根目录配置
    ROOT_DIR=$(grep -E "^\s*root" "$NGINX_CONF" | head -1 | awk '{print $2}' | tr -d ';')
    echo -e "\n当前根目录配置: ${YELLOW}$ROOT_DIR${NC}"
    
    if [[ "$ROOT_DIR" == *"php-backend"* ]]; then
        echo -e "${RED}❌ 根目录配置错误！不应该指向php-backend${NC}"
        echo "需要修改为: /www/wwwroot/learning-platform"
    fi
else
    echo -e "${RED}❌ 未找到Nginx配置文件${NC}"
    echo "需要在宝塔面板中创建网站配置"
fi

echo -e "\n${YELLOW}[步骤4] 修复Nginx配置${NC}"
echo "======================================"

# 创建正确的Nginx配置
cat > /tmp/nginx-fix.conf << 'EOF'
server {
    listen 80;
    server_name 47.109.142.72;
    root /www/wwwroot/learning-platform;
    index index.html index.htm;
    
    # 错误日志
    error_log /www/wwwlogs/learning-platform.error.log;
    access_log /www/wwwlogs/learning-platform.access.log;

    # 前端静态文件处理
    location / {
        root /www/wwwroot/learning-platform/dist;
        try_files $uri $uri/ /index.html;
        
        # 修复JavaScript MIME类型问题
        location ~* \.js$ {
            add_header Content-Type "text/javascript; charset=UTF-8";
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.css$ {
            add_header Content-Type "text/css; charset=UTF-8";
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Node.js API代理（端口3001或3002）
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # 处理CORS
        add_header Access-Control-Allow-Origin "$http_origin" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 健康检查
    location = /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
    }

    # 文件上传目录
    location ^~ /uploads/ {
        alias /www/wwwroot/learning-platform/server/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # 安全设置
    location ~ /\.(env|git|gitignore|htaccess) {
        deny all;
        return 404;
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo -e "${GREEN}✅ 已生成正确的Nginx配置${NC}"
echo "配置文件保存在: /tmp/nginx-fix.conf"

if [ -n "$NGINX_CONF" ]; then
    echo -e "\n${YELLOW}是否要备份并替换当前配置？${NC}"
    echo "当前配置: $NGINX_CONF"
    echo "建议先在宝塔面板中手动修改"
    
    # 备份当前配置
    cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ 已备份当前配置${NC}"
fi

echo -e "\n${YELLOW}[步骤5] 检查端口监听${NC}"
echo "======================================"

# 检查80端口
echo "检查80端口（HTTP）..."
if netstat -tlnp | grep -q ":80 "; then
    echo -e "${GREEN}✅ 80端口正在监听${NC}"
    netstat -tlnp | grep ":80 "
else
    echo -e "${RED}❌ 80端口未监听${NC}"
fi

# 检查3001/3002端口（Node.js后端）
echo -e "\n检查Node.js后端端口..."
if netstat -tlnp | grep -q ":3001 "; then
    echo -e "${GREEN}✅ 3001端口正在监听（Node.js后端）${NC}"
    netstat -tlnp | grep ":3001 "
elif netstat -tlnp | grep -q ":3002 "; then
    echo -e "${GREEN}✅ 3002端口正在监听（Node.js后端）${NC}"
    netstat -tlnp | grep ":3002 "
else
    echo -e "${YELLOW}⚠️  Node.js后端未运行${NC}"
    echo "需要启动Node.js后端服务"
fi

# 检查宝塔面板端口
echo -e "\n检查宝塔面板端口..."
if netstat -tlnp | grep -q ":${BAOTA_PANEL_PORT} "; then
    echo -e "${GREEN}✅ 宝塔面板端口${BAOTA_PANEL_PORT}正在监听${NC}"
else
    echo -e "${RED}❌ 宝塔面板端口未监听${NC}"
fi

echo -e "\n${YELLOW}[步骤6] 测试访问${NC}"
echo "======================================"

# 测试本地访问
echo "测试本地访问..."
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost/ || echo "本地访问失败"

# 检查防火墙
echo -e "\n检查防火墙规则..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --list-all 2>/dev/null | grep -E "ports:|services:"
elif command -v ufw &> /dev/null; then
    ufw status 2>/dev/null
else
    iptables -L -n | grep -E "ACCEPT.*dpt:(80|443|${BAOTA_PANEL_PORT})" | head -5
fi

echo -e "\n${YELLOW}[修复建议]${NC}"
echo "======================================"
echo "1. 登录宝塔面板: http://${WEBSITE_DOMAIN}:${BAOTA_PANEL_PORT}"
echo "2. 进入【网站】→ 找到 ${WEBSITE_DOMAIN}"
echo "3. 点击【设置】→【网站目录】"
echo "4. 修改网站根目录为: /www/wwwroot/learning-platform"
echo "5. 运行目录保持为: /"
echo "6. 点击【配置文件】，使用 /tmp/nginx-fix.conf 的内容替换"
echo "7. 保存配置并重载Nginx"
echo ""
echo "如果Node.js后端未运行，执行:"
echo "cd /www/wwwroot/learning-platform/server"
echo "npm install && pm2 start app.js --name learning-platform"
echo ""
echo "如果需要查看错误日志:"
echo "tail -f /www/wwwlogs/learning-platform.error.log"

echo -e "\n${GREEN}诊断完成！${NC}"
echo "======================================"

# 生成快速修复命令
cat > /tmp/quick-fix.sh << 'EOF'
#!/bin/bash
# 快速修复命令
systemctl restart nginx
cd /www/wwwroot/learning-platform/server && pm2 restart all
echo "修复完成，请访问: http://47.109.142.72"
EOF

chmod +x /tmp/quick-fix.sh
echo -e "\n快速修复脚本已生成: /tmp/quick-fix.sh"





