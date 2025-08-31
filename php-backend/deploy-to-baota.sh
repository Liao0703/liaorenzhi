#!/bin/bash

# 🚄 学习平台PHP后端 - 宝塔部署脚本
# 适用于宝塔面板环境

echo "🚀 开始部署学习平台PHP后端..."
echo "=========================================="

# 检查当前目录
CURRENT_DIR=$(pwd)
echo "📂 当前目录: $CURRENT_DIR"

# 检查PHP版本
PHP_VERSION=$(php -v 2>/dev/null | head -n1 | cut -d' ' -f2)
echo "🐘 PHP版本: ${PHP_VERSION:-'未安装'}"

if [ -z "$PHP_VERSION" ]; then
    echo "❌ 错误: PHP未安装或不在PATH中"
    echo "请在宝塔面板安装PHP 7.4或更高版本"
    exit 1
fi

# 检查Composer
if ! command -v composer &> /dev/null; then
    echo "📦 安装Composer..."
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
fi

COMPOSER_VERSION=$(composer --version 2>/dev/null | head -n1)
echo "📦 Composer版本: ${COMPOSER_VERSION:-'未安装'}"

# 创建必要目录
echo "📁 创建项目目录..."
mkdir -p logs uploads var/cache

# 设置权限
echo "🔐 设置文件权限..."
chmod -R 755 .
chmod -R 777 logs uploads var/cache

# 复制环境配置
if [ ! -f ".env" ]; then
    echo "⚙️ 创建环境配置..."
    cp .env.example .env
    echo "请编辑 .env 文件配置数据库连接信息"
fi

# 安装依赖
echo "📦 安装PHP依赖..."
if [ -f "composer.lock" ]; then
    rm composer.lock
fi

composer install --optimize-autoloader --no-dev

# 检查数据库连接
echo "🗄️ 检查数据库连接..."
php -r "
require 'vendor/autoload.php';
\$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
\$dotenv->load();

try {
    \$pdo = new PDO(
        'mysql:host=' . \$_ENV['DB_HOST'] . ';port=' . \$_ENV['DB_PORT'] . ';dbname=' . \$_ENV['DB_DATABASE'],
        \$_ENV['DB_USERNAME'],
        \$_ENV['DB_PASSWORD']
    );
    echo '✅ 数据库连接成功' . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ 数据库连接失败: ' . \$e->getMessage() . PHP_EOL;
    exit(1);
}
"

# 测试API
echo "🧪 测试API服务..."
php -S localhost:8000 -t public > /dev/null 2>&1 &
TEST_PID=$!
sleep 3

# 测试健康检查
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API服务测试通过"
else
    echo "❌ API服务测试失败 (HTTP: $HTTP_CODE)"
fi

# 停止测试服务器
kill $TEST_PID 2>/dev/null

echo ""
echo "🎉 PHP后端部署完成！"
echo "=========================================="
echo "📋 后续步骤:"
echo "1. 在宝塔面板创建PHP网站"
echo "2. 将网站根目录设置为: $(pwd)/public"
echo "3. 确保PHP版本 >= 7.4"
echo "4. 编辑 .env 文件配置数据库"
echo "5. 访问 http://your-domain.com/health 测试"
echo ""
echo "📞 如遇问题，请检查:"
echo "- 数据库连接配置"
echo "- 文件权限设置"
echo "- PHP扩展安装"




