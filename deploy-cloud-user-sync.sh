#!/bin/bash

# 云数据库用户同步部署脚本
# 用于修复401错误并实现与云数据库的同步

echo "🚀 开始部署云数据库用户同步功能..."

# 检查是否安装了必要的依赖
echo "📦 检查并安装依赖..."
if ! npm list mysql2 2>/dev/null | grep -q mysql2; then
    echo "安装 mysql2..."
    npm install mysql2
fi

if ! npm list bcryptjs 2>/dev/null | grep -q bcryptjs; then
    echo "安装 bcryptjs..."
    npm install bcryptjs
fi

if ! npm list jsonwebtoken 2>/dev/null | grep -q jsonwebtoken; then
    echo "安装 jsonwebtoken..."
    npm install jsonwebtoken
fi

# 创建.env文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 创建.env配置文件..."
    cp env.cloud .env
    echo "✅ .env文件已创建"
else
    echo "⚠️ .env文件已存在，跳过创建"
fi

# 初始化云数据库
echo ""
echo "🔄 初始化云数据库..."
node cloud-user-sync.cjs

# 重启服务器
echo ""
echo "🔄 重启Node.js服务器..."

# 检查是否有正在运行的服务器进程
if lsof -i :3002 > /dev/null 2>&1; then
    echo "停止现有服务器..."
    # 获取占用3002端口的进程ID
    PID=$(lsof -ti :3002)
    if [ ! -z "$PID" ]; then
        kill -9 $PID
        echo "✅ 已停止进程 $PID"
    fi
fi

# 启动服务器
echo "启动新服务器..."
npm run server &

# 等待服务器启动
sleep 3

# 检查服务器是否成功启动
if lsof -i :3002 > /dev/null 2>&1; then
    echo "✅ 服务器已在端口3002启动"
else
    echo "❌ 服务器启动失败"
    exit 1
fi

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 测试步骤："
echo "1. 打开浏览器访问: http://localhost:5173"
echo "2. 使用管理员账号登录:"
echo "   用户名: admin"
echo "   密码: 123456"
echo "3. 进入管理面板，点击'用户账号管理'标签"
echo "4. 测试添加、编辑、删除用户功能"
echo ""
echo "🔍 调试提示："
echo "- 查看服务器日志: tail -f server.log"
echo "- 检查数据库连接: node cloud-user-sync.cjs"
echo "- 查看浏览器控制台是否有auth_token"
echo ""
echo "💡 如果仍有401错误："
echo "1. 清除浏览器缓存和localStorage"
echo "2. 重新登录获取新的token"
echo "3. 确保使用admin或maintenance账号"
