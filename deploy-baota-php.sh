#!/bin/bash

# 🚄 兴隆场车站学习平台 - 宝塔PHP项目一键部署脚本
# 适用于域名: 47.109.142.72
# 部署环境: 宝塔面板 + PHP + MySQL

set -e  # 遇到错误立即退出

echo "🚀 开始部署兴隆场车站学习平台（PHP版本）"
echo "========================================================"
echo "📍 域名: 47.109.142.72"
echo "🏗️ 后端: PHP (Slim 4框架)"
echo "🎨 前端: React + TypeScript"
echo "🗄️ 数据库: MySQL"
echo "========================================================"

# 配置变量
DOMAIN="47.109.142.72"
WEB_ROOT="/www/wwwroot/${DOMAIN}"
PHP_BACKEND_DIR="${WEB_ROOT}/php-backend"
FRONTEND_DIR="${WEB_ROOT}/dist"
DB_NAME="learning_platform"
DB_USER="learning_platform"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root用户运行此脚本"
    exit 1
fi

# 检查宝塔面板是否安装
if [ ! -f "/www/server/panel/BT-Panel" ]; then
    echo "❌ 未检测到宝塔面板，请先安装宝塔面板"
    echo "安装命令: wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sh install.sh"
    exit 1
fi

echo "✅ 检测到宝塔面板，继续部署..."

# 检查必要组件
echo "🔍 检查环境组件..."

# 检查PHP
PHP_VERSION=$(php -v 2>/dev/null | head -n1 | cut -d' ' -f2 || echo "未安装")
echo "🐘 PHP版本: ${PHP_VERSION}"

if [ "$PHP_VERSION" = "未安装" ]; then
    echo "❌ PHP未安装，请在宝塔面板安装PHP 7.4或8.0"
    exit 1
fi

# 检查MySQL
MYSQL_VERSION=$(mysql -V 2>/dev/null | awk '{print $5}' | cut -d, -f1 || echo "未安装")
echo "🗄️ MySQL版本: ${MYSQL_VERSION}"

if [ "$MYSQL_VERSION" = "未安装" ]; then
    echo "❌ MySQL未安装，请在宝塔面板安装MySQL 5.7+"
    exit 1
fi

# 检查Nginx
NGINX_VERSION=$(nginx -v 2>&1 | cut -d/ -f2 || echo "未安装")
echo "🌐 Nginx版本: ${NGINX_VERSION}"

if [ "$NGINX_VERSION" = "未安装" ]; then
    echo "❌ Nginx未安装，请在宝塔面板安装Nginx"
    exit 1
fi

# 创建项目目录
echo "📁 创建项目目录结构..."
mkdir -p "$WEB_ROOT"
mkdir -p "$PHP_BACKEND_DIR"
mkdir -p "$FRONTEND_DIR"

# 第一步：部署PHP后端
echo "🔧 第一步：部署PHP后端..."

if [ ! -d "php-backend" ]; then
    echo "❌ 未找到php-backend目录，请确保在项目根目录运行此脚本"
    exit 1
fi

# 复制PHP后端文件
echo "📂 复制PHP后端文件..."
cp -r php-backend/* "$PHP_BACKEND_DIR/"

# 进入PHP后端目录
cd "$PHP_BACKEND_DIR"

# 检查Composer
if ! command -v composer &> /dev/null; then
    echo "📦 安装Composer..."
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
fi

# 安装PHP依赖
echo "📦 安装PHP依赖..."
composer install --optimize-autoloader --no-dev

# 创建环境配置
if [ ! -f ".env" ]; then
    echo "⚙️ 创建环境配置..."
    cp .env.example .env
    
    # 生成随机JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    
    # 配置.env文件
    cat > .env << EOF
APP_ENV=production
APP_DEBUG=false
APP_NAME="兴隆场车站学习平台"

DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=请在宝塔面板设置数据库密码后更新此处

JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=86400

UPLOAD_PATH=${PHP_BACKEND_DIR}/uploads
MAX_UPLOAD_SIZE=52428800
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,json,jpg,png,gif
EOF
    
    echo "⚠️ 请在宝塔面板创建数据库后，编辑 ${PHP_BACKEND_DIR}/.env 文件配置数据库密码"
fi

# 创建必要目录并设置权限
echo "🔐 设置文件权限..."
mkdir -p logs uploads var/cache
chmod -R 755 .
chmod -R 777 logs uploads var/cache
chown -R www:www .

# 第二步：构建前端
echo "🎨 第二步：构建前端..."
cd "$(dirname "$0")"  # 回到项目根目录

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请在宝塔面板安装Node.js 16+"
    echo "或者在本地构建后上传dist目录"
    exit 1
fi

# 检查是否已有构建产物
if [ -d "dist" ]; then
    echo "📁 发现已存在的构建产物，直接使用..."
    cp -r dist/* "$FRONTEND_DIR/"
else
    echo "🔨 构建前端应用..."
    if [ -f "package.json" ]; then
        npm install
        npm run build
        
        if [ -d "dist" ]; then
            cp -r dist/* "$FRONTEND_DIR/"
        else
            echo "❌ 前端构建失败，请检查构建配置"
            exit 1
        fi
    else
        echo "❌ 未找到package.json，请确保在项目根目录运行"
        exit 1
    fi
fi

# 设置前端文件权限
chmod -R 755 "$FRONTEND_DIR"
chown -R www:www "$FRONTEND_DIR"

# 第三步：配置Nginx
echo "🌐 第三步：配置Nginx..."

# 复制Nginx配置
NGINX_CONF="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
if [ -f "nginx-php-baota.conf" ]; then
    cp nginx-php-baota.conf "$NGINX_CONF"
    echo "✅ Nginx配置已更新"
else
    echo "⚠️ 未找到nginx-php-baota.conf，请手动配置Nginx"
fi

# 重载Nginx
nginx -t && nginx -s reload
echo "✅ Nginx配置已生效"

# 第四步：数据库提醒
echo "🗄️ 第四步：数据库配置提醒..."
echo "⚠️ 请在宝塔面板完成以下操作："
echo "1. 创建数据库: $DB_NAME"
echo "2. 创建数据库用户: $DB_USER"
echo "3. 导入SQL文件: server/init.sql"
echo "4. 更新.env文件中的数据库密码"

# 第五步：测试部署
echo "🧪 第五步：测试部署..."

# 等待用户确认数据库配置
echo "请按任意键继续测试（确保已完成数据库配置）..."
read -n 1 -s

# 测试PHP后端
echo "测试PHP后端健康检查..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PHP后端健康检查通过"
else
    echo "⚠️ PHP后端健康检查失败 (HTTP: $HTTP_CODE)"
    echo "请检查数据库配置和PHP错误日志"
fi

# 测试前端
echo "测试前端页面..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}/" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 前端页面访问正常"
else
    echo "⚠️ 前端页面访问失败 (HTTP: $HTTP_CODE)"
fi

echo ""
echo "🎉 部署完成！"
echo "========================================================"
echo "🌐 网站地址: http://${DOMAIN}"
echo "🧪 API测试: http://${DOMAIN}/php-backend/public/test-api.html"
echo "🔐 默认账户:"
echo "   管理员: admin / admin123456"
echo "   演示用户: demo / demo123456"
echo "   维护用户: maintenance / maintenance123456"
echo ""
echo "📋 后续步骤:"
echo "1. 访问网站测试功能"
echo "2. 修改默认密码"
echo "3. 配置SSL证书（推荐）"
echo "4. 设置定期备份"
echo ""
echo "📞 如遇问题，请检查："
echo "- PHP错误日志: /www/wwwlogs/${DOMAIN}.error.log"
echo "- 数据库连接配置: ${PHP_BACKEND_DIR}/.env"
echo "- Nginx配置: ${NGINX_CONF}"
echo "========================================================"
