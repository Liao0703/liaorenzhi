#!/bin/bash
# PM2安装和启动脚本
# 解决"pm2: command not found"问题

echo "========================================="
echo "🔧 安装PM2并启动Node.js服务"
echo "========================================="

# 1. 检查Node.js版本
echo "1. 检查Node.js环境..."
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js版本: $(node --version)"
    echo "✅ npm版本: $(npm --version)"
else
    echo "❌ Node.js未安装，请先在宝塔软件商店安装Node.js"
    exit 1
fi

# 2. 安装PM2
echo ""
echo "2. 安装PM2..."
echo "正在全局安装PM2..."
npm install -g pm2

# 检查PM2是否安装成功
if command -v pm2 >/dev/null 2>&1; then
    echo "✅ PM2安装成功，版本: $(pm2 --version)"
else
    echo "❌ PM2安装失败，尝试使用npx运行..."
    echo "将使用 npx pm2 替代 pm2 命令"
fi

# 3. 进入项目目录
echo ""
echo "3. 进入项目目录..."
PROJECT_PATH="/www/wwwroot/learning-platform/server"
if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ 项目目录不存在: $PROJECT_PATH"
    exit 1
fi

cd "$PROJECT_PATH" || exit 1
echo "✅ 当前目录: $(pwd)"

# 4. 检查启动文件
echo ""
echo "4. 检查启动文件..."
if [ -f "app.js" ]; then
    START_FILE="app.js"
    echo "✅ 找到启动文件: app.js"
elif [ -f "app-simple.js" ]; then
    START_FILE="app-simple.js"
    echo "✅ 找到启动文件: app-simple.js"
else
    echo "❌ 未找到启动文件 (app.js 或 app-simple.js)"
    ls -la *.js 2>/dev/null || echo "当前目录没有JavaScript文件"
    exit 1
fi

# 5. 安装项目依赖
echo ""
echo "5. 安装项目依赖..."
if [ -f "package.json" ]; then
    npm install
    echo "✅ 依赖安装完成"
else
    echo "⚠️ 未找到package.json，跳过依赖安装"
fi

# 6. 创建上传目录
echo ""
echo "6. 创建必要目录..."
mkdir -p uploads
chmod 755 uploads
echo "✅ 上传目录创建完成"

# 7. 设置环境变量
export PORT=3002
export NODE_ENV=production

# 8. 停止现有进程（如果存在）
echo ""
echo "7. 清理现有进程..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete learning-platform 2>/dev/null || echo "没有找到现有进程"
else
    npx pm2 delete learning-platform 2>/dev/null || echo "没有找到现有进程"
fi

# 9. 启动新进程
echo ""
echo "8. 启动Node.js服务..."
if command -v pm2 >/dev/null 2>&1; then
    # 使用直接安装的PM2
    pm2 start "$START_FILE" --name learning-platform -- --port 3002
    PM2_CMD="pm2"
else
    # 使用npx运行PM2
    npx pm2 start "$START_FILE" --name learning-platform -- --port 3002
    PM2_CMD="npx pm2"
fi

# 10. 等待服务启动
echo "等待服务启动..."
sleep 3

# 11. 检查进程状态
echo ""
echo "9. 检查服务状态..."
$PM2_CMD list

# 12. 检查端口
echo ""
echo "10. 检查端口监听..."
if netstat -tuln | grep -q ":3002"; then
    echo "✅ 3002端口正在监听"
else
    echo "❌ 3002端口未监听"
    echo "进程日志："
    $PM2_CMD logs learning-platform --lines 10 --nostream
fi

# 13. 测试服务
echo ""
echo "11. 测试服务..."
sleep 2
TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null || echo "000")
if [ "$TEST_RESPONSE" = "200" ]; then
    echo "✅ 服务健康检查通过"
elif [ "$TEST_RESPONSE" = "404" ]; then
    echo "⚠️ 服务运行但健康检查接口不存在（正常）"
    # 测试根路径
    ROOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ 2>/dev/null || echo "000")
    echo "根路径响应: $ROOT_RESPONSE"
else
    echo "❌ 服务测试失败 (HTTP $TEST_RESPONSE)"
fi

# 14. 测试文件上传接口
echo ""
echo "12. 测试文件上传接口..."
echo "测试内容" > /tmp/test.txt
UPLOAD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -F "file=@/tmp/test.txt" \
  http://localhost:3002/api/files/upload 2>/dev/null || echo "000")

if [ "$UPLOAD_RESPONSE" = "200" ] || [ "$UPLOAD_RESPONSE" = "400" ]; then
    echo "✅ 文件上传接口响应正常 (HTTP $UPLOAD_RESPONSE)"
else
    echo "❌ 文件上传接口异常 (HTTP $UPLOAD_RESPONSE)"
fi

rm -f /tmp/test.txt

# 15. 设置PM2开机自启
echo ""
echo "13. 设置开机自启..."
$PM2_CMD startup
$PM2_CMD save

echo ""
echo "========================================="
echo "🎉 安装和启动完成！"
echo ""
echo "📊 服务信息："
echo "- 项目名: learning-platform"
echo "- 端口: 3002"
echo "- 启动文件: $START_FILE"
echo "- PM2命令: $PM2_CMD"
echo ""
echo "🔧 管理命令："
echo "- 查看状态: $PM2_CMD list"
echo "- 查看日志: $PM2_CMD logs learning-platform"
echo "- 重启服务: $PM2_CMD restart learning-platform"
echo "- 停止服务: $PM2_CMD stop learning-platform"
echo ""
echo "🌐 现在可以测试前端文件上传功能了！"
echo "========================================="

