#!/bin/bash

echo "🔧 快速修复登录问题"
echo "===================="

# 1. 停止所有Node进程
echo "1. 停止现有服务..."
pkill -f "node.*app.js" 2>/dev/null || true
sleep 1

# 2. 清理缓存
echo "2. 清理npm缓存..."
npm cache clean --force 2>/dev/null || true

# 3. 确保依赖安装
echo "3. 检查依赖..."
if ! npm list express 2>/dev/null | grep -q express; then
    echo "   安装缺失的依赖..."
    npm install
fi

# 4. 启动服务器
echo "4. 启动服务器..."
npm start &
SERVER_PID=$!

# 等待服务器启动
echo "   等待服务器启动..."
sleep 3

# 5. 测试服务器
echo "5. 测试服务器连接..."
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "   ✅ 服务器运行正常"
else
    echo "   ❌ 服务器启动失败"
    exit 1
fi

# 6. 测试登录API
echo "6. 测试登录API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"123456"}')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "   ✅ 登录API正常"
else
    echo "   ❌ 登录API异常"
    echo "   响应: $LOGIN_RESPONSE"
fi

echo ""
echo "===================="
echo "✅ 修复完成！"
echo ""
echo "请执行以下步骤："
echo "1. 打开浏览器访问: http://localhost:5173"
echo "2. 使用以下账号登录："
echo "   用户名: admin"
echo "   密码: 123456"
echo ""
echo "如果仍有问题："
echo "1. 清除浏览器缓存 (Ctrl+Shift+Delete)"
echo "2. 使用无痕模式重试"
echo "3. 打开 fix-login-error.html 进行诊断"
echo ""
echo "服务器PID: $SERVER_PID"
echo "停止服务器: kill $SERVER_PID"
