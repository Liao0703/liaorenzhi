#!/bin/bash

# 🚨 宝塔500错误自动修复脚本
# 作用：自动诊断和修复PHP 500内部服务器错误

echo "=================================="
echo "🚨 开始修复500错误"
echo "=================================="

# 设置项目路径
PROJECT_PATH="/www/wwwroot/learning-platform"
PHP_BACKEND_PATH="$PROJECT_PATH/php-backend"

# 步骤1：检查错误日志
echo "📋 步骤1：检查错误日志..."
echo "最新的Nginx错误:"
tail -5 /www/wwwlogs/learning-platform.error.log 2>/dev/null || echo "❌ 无法访问Nginx错误日志"

echo "最新的PHP错误:"
tail -5 /www/server/php/74/var/log/php-fpm.log 2>/dev/null || echo "❌ 无法访问PHP错误日志"

# 步骤2：检查PHP进程状态
echo "🔍 步骤2：检查PHP-FPM状态..."
if systemctl is-active --quiet php-fpm-74; then
    echo "✅ PHP-FPM正在运行"
else
    echo "❌ PHP-FPM未运行，正在重启..."
    systemctl restart php-fpm-74
    sleep 2
    if systemctl is-active --quiet php-fpm-74; then
        echo "✅ PHP-FPM重启成功"
    else
        echo "❌ PHP-FPM重启失败"
    fi
fi

# 步骤3：检查项目目录和权限
echo "📁 步骤3：检查项目目录和权限..."
if [ -d "$PROJECT_PATH" ]; then
    echo "✅ 项目目录存在: $PROJECT_PATH"
    
    if [ -d "$PHP_BACKEND_PATH" ]; then
        echo "✅ PHP后端目录存在"
        
        # 检查关键文件
        if [ -f "$PHP_BACKEND_PATH/public/index.php" ]; then
            echo "✅ PHP入口文件存在"
        else
            echo "❌ 缺少PHP入口文件: $PHP_BACKEND_PATH/public/index.php"
        fi
        
        if [ -f "$PHP_BACKEND_PATH/vendor/autoload.php" ]; then
            echo "✅ Composer autoload存在"
        else
            echo "❌ 缺少Composer依赖，正在安装..."
            cd "$PHP_BACKEND_PATH"
            if command -v composer &> /dev/null; then
                composer install --no-dev --optimize-autoloader
                echo "✅ Composer依赖安装完成"
            else
                echo "❌ Composer未安装，请先安装Composer"
            fi
        fi
        
        if [ -f "$PHP_BACKEND_PATH/.env" ]; then
            echo "✅ 环境配置文件存在"
        else
            echo "❌ 缺少.env文件，正在创建..."
            cat > "$PHP_BACKEND_PATH/.env" << 'EOF'
APP_NAME=LearningPlatform
APP_ENV=production
APP_DEBUG=false

# 数据库配置（云数据库）
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_DATABASE=learning_platform
DB_USERNAME=admin123
DB_PASSWORD=Liao0820

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-learning-platform-2025
JWT_EXPIRE=86400

# 日志配置
LOG_LEVEL=error
LOG_PATH=/www/wwwroot/learning-platform/php-backend/logs

# 上传配置
UPLOAD_PATH=/www/wwwroot/learning-platform/php-backend/uploads
MAX_UPLOAD_SIZE=52428800
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,json
EOF
            echo "✅ .env文件创建完成"
        fi
        
    else
        echo "❌ PHP后端目录不存在: $PHP_BACKEND_PATH"
    fi
else
    echo "❌ 项目目录不存在: $PROJECT_PATH"
fi

# 步骤4：修复文件权限
echo "🔧 步骤4：修复文件权限..."
chown -R www:www "$PROJECT_PATH"
chmod -R 755 "$PHP_BACKEND_PATH"

# 创建必要目录
mkdir -p "$PHP_BACKEND_PATH/logs"
mkdir -p "$PHP_BACKEND_PATH/uploads"  
mkdir -p "$PHP_BACKEND_PATH/var/cache"

# 设置特殊权限
chmod -R 777 "$PHP_BACKEND_PATH/logs"
chmod -R 777 "$PHP_BACKEND_PATH/uploads"
chmod -R 777 "$PHP_BACKEND_PATH/var"

echo "✅ 权限修复完成"

# 步骤5：PHP语法检查
echo "🔍 步骤5：PHP语法检查..."
if [ -f "$PHP_BACKEND_PATH/public/index.php" ]; then
    if php -l "$PHP_BACKEND_PATH/public/index.php" > /dev/null 2>&1; then
        echo "✅ PHP入口文件语法正确"
    else
        echo "❌ PHP入口文件语法错误:"
        php -l "$PHP_BACKEND_PATH/public/index.php"
    fi
else
    echo "❌ PHP入口文件不存在"
fi

# 步骤6：创建测试文件
echo "🧪 步骤6：创建测试文件..."
cat > "$PHP_BACKEND_PATH/public/500-test.php" << 'EOF'
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>500错误修复测试</h1>";
echo "<p>如果您能看到这个页面，说明PHP基本工作正常</p>";

echo "<h2>系统信息</h2>";
echo "PHP版本: " . PHP_VERSION . "<br>";
echo "当前时间: " . date('Y-m-d H:i:s') . "<br>";
echo "内存限制: " . ini_get('memory_limit') . "<br>";
echo "执行时间限制: " . ini_get('max_execution_time') . "s<br>";

echo "<h2>扩展检查</h2>";
$extensions = ['pdo_mysql', 'curl', 'json', 'mbstring', 'openssl'];
foreach ($extensions as $ext) {
    $status = extension_loaded($ext) ? '✅' : '❌';
    echo "$ext: $status<br>";
}

echo "<h2>文件检查</h2>";
$files = [
    '../vendor/autoload.php' => 'Composer自动加载',
    '../.env' => '环境配置',
    '../composer.json' => 'Composer配置'
];

foreach ($files as $file => $name) {
    $status = file_exists($file) ? '✅' : '❌';
    echo "$name ($file): $status<br>";
}

echo "<h2>数据库连接测试</h2>";
try {
    $host = 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com';
    $database = 'learning_platform';
    $username = 'admin123';
    $password = 'Liao0820';
    
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    echo "✅ 数据库连接成功<br>";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    echo "✅ 数据查询成功，用户数: " . $result['count'] . "<br>";
    
} catch (Exception $e) {
    echo "❌ 数据库连接失败: " . $e->getMessage() . "<br>";
}

if (function_exists('curl_version')) {
    echo "<h2>网络连接测试</h2>";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.baidu.com");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        echo "✅ 网络连接正常<br>";
    } else {
        echo "❌ 网络连接异常 (HTTP $httpCode)<br>";
    }
}
?>
EOF

echo "✅ 测试文件创建完成: /php-backend/public/500-test.php"

# 步骤7：重启服务
echo "🔄 步骤7：重启相关服务..."
systemctl restart php-fpm-74
systemctl reload nginx

echo "✅ 服务重启完成"

# 步骤8：清理缓存
echo "🧹 步骤8：清理缓存..."
if [ -d "$PHP_BACKEND_PATH/var/cache" ]; then
    rm -rf "$PHP_BACKEND_PATH/var/cache"/*
    echo "✅ PHP缓存清理完成"
fi

# 完成
echo "=================================="
echo "✅ 500错误修复脚本执行完成！"
echo "=================================="
echo ""
echo "📋 测试步骤："
echo "1. 访问测试页面: http://47.109.142.72/php-backend/public/500-test.php"
echo "2. 访问主页面: http://47.109.142.72"
echo "3. 测试API接口: http://47.109.142.72/api/auth/login"
echo ""
echo "🔍 如果问题依然存在，请查看："
echo "- Nginx错误日志: tail -f /www/wwwlogs/learning-platform.error.log"  
echo "- PHP错误日志: tail -f /www/server/php/74/var/log/php-fpm.log"
echo ""
echo "📞 需要进一步支持请提供上述日志内容"



