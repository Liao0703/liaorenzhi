#!/bin/bash
# 修复文件上传404错误脚本
# 使用方法：在宝塔面板终端中执行此脚本

echo "========================================="
echo "🔧 修复文件上传404错误"
echo "========================================="

# 设置项目路径
PROJECT_PATH="/www/wwwroot/learning-platform"
SERVER_PATH="$PROJECT_PATH/server"

# 1. 检查项目目录
echo "1. 检查项目目录..."
if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ 项目目录不存在: $PROJECT_PATH"
    echo "请确保项目已正确部署到宝塔"
    exit 1
else
    echo "✅ 项目目录存在"
fi

# 2. 进入服务器目录
cd "$SERVER_PATH" || {
    echo "❌ 无法进入服务器目录: $SERVER_PATH"
    exit 1
}

echo "当前目录: $(pwd)"

# 3. 检查Node.js和npm
echo ""
echo "2. 检查Node.js环境..."
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js版本: $(node --version)"
else
    echo "❌ Node.js未安装，请在宝塔软件商店安装Node.js"
    exit 1
fi

# 4. 安装依赖包
echo ""
echo "3. 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖包..."
    npm install
else
    echo "✅ 依赖包已存在"
fi

# 5. 检查PM2
echo ""
echo "4. 检查PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 6. 停止现有进程
echo ""
echo "5. 停止现有进程..."
pm2 delete learning-platform 2>/dev/null || echo "没有找到现有进程"

# 7. 选择合适的应用文件
echo ""
echo "6. 选择应用文件..."
APP_FILE="app.js"
if [ ! -f "$APP_FILE" ]; then
    APP_FILE="app-simple.js"
    if [ ! -f "$APP_FILE" ]; then
        echo "❌ 找不到应用文件 (app.js 或 app-simple.js)"
        exit 1
    fi
fi
echo "✅ 使用应用文件: $APP_FILE"

# 8. 创建上传目录
echo ""
echo "7. 创建上传目录..."
UPLOAD_DIR="$SERVER_PATH/uploads"
mkdir -p "$UPLOAD_DIR"
chmod 755 "$UPLOAD_DIR"
echo "✅ 上传目录: $UPLOAD_DIR"

# 9. 启动Node.js服务
echo ""
echo "8. 启动Node.js服务..."
export PORT=3002
pm2 start "$APP_FILE" --name learning-platform --port 3002

# 等待服务启动
sleep 3

# 10. 检查服务状态
echo ""
echo "9. 检查服务状态..."
if pm2 list | grep -q "learning-platform.*online"; then
    echo "✅ Node.js服务启动成功"
else
    echo "❌ Node.js服务启动失败"
    echo "PM2日志："
    pm2 logs learning-platform --lines 10 --nostream
fi

# 11. 检查端口
echo ""
echo "10. 检查端口..."
if netstat -tuln | grep -q ":3002"; then
    echo "✅ 3002端口正在监听"
else
    echo "❌ 3002端口未监听"
fi

# 12. 测试文件上传接口
echo ""
echo "11. 测试文件上传接口..."
echo "测试内容" > /tmp/test.txt
sleep 2

# 测试本地接口
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -F "file=@/tmp/test.txt" \
  http://localhost:3002/api/files/upload 2>/dev/null || echo "000")

if [ "$LOCAL_RESPONSE" = "200" ]; then
    echo "✅ 本地接口测试通过 (HTTP $LOCAL_RESPONSE)"
elif [ "$LOCAL_RESPONSE" = "400" ]; then
    echo "✅ 本地接口响应正常 (HTTP $LOCAL_RESPONSE - 可能是验证错误)"
else
    echo "❌ 本地接口测试失败 (HTTP $LOCAL_RESPONSE)"
fi

# 13. 重载Nginx
echo ""
echo "12. 重载Nginx配置..."
if nginx -t 2>/dev/null; then
    nginx -s reload
    echo "✅ Nginx配置重载成功"
else
    echo "❌ Nginx配置有误"
fi

# 14. 测试通过Nginx的接口
echo ""
echo "13. 测试通过Nginx的接口..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  http://47.109.142.72/api/files/upload 2>/dev/null || echo "000")

if [ "$NGINX_RESPONSE" = "200" ] || [ "$NGINX_RESPONSE" = "400" ]; then
    echo "✅ Nginx代理测试通过 (HTTP $NGINX_RESPONSE)"
else
    echo "❌ Nginx代理测试失败 (HTTP $NGINX_RESPONSE)"
fi

# 15. 清理测试文件
rm -f /tmp/test.txt

echo ""
echo "========================================="
echo "🎉 修复完成！"
echo ""
echo "📊 服务状态："
pm2 list | grep learning-platform || echo "PM2进程未找到"
echo ""
echo "🔍 如果文件上传仍有问题，请检查："
echo "1. PM2日志: pm2 logs learning-platform"
echo "2. Nginx错误日志: tail -f /www/wwwlogs/learning-platform.error.log"
echo "3. 文件权限: ls -la $UPLOAD_DIR"
echo ""
echo "📝 手动测试命令："
echo "curl -X POST -F 'file=@测试文件' http://47.109.142.72/api/files/upload"
echo "========================================="

