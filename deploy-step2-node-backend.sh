#!/bin/bash
# 第2步：启动Node后端在3001端口
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 第2步：启动Node后端服务"
echo "========================================"

# 获取项目根目录（脚本所在目录）
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"

echo "📁 项目根目录：$PROJECT_ROOT"
echo "📁 后端目录：$SERVER_DIR"

# 1. 检查Node.js是否已安装
echo ""
echo "🟢 检查Node.js环境..."
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js已安装，版本：$(node -v)"
else
    echo "❌ Node.js未安装！请先安装Node.js 16+版本"
    echo "安装命令："
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

if command -v npm >/dev/null 2>&1; then
    echo "✅ npm已安装，版本：$(npm -v)"
else
    echo "❌ npm未安装！请检查Node.js安装"
    exit 1
fi

# 2. 检查后端目录是否存在
echo ""
echo "📂 检查后端目录..."
if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ 后端目录不存在：$SERVER_DIR"
    echo "请确认当前位置是项目根目录"
    exit 1
fi

if [ ! -f "$SERVER_DIR/package.json" ]; then
    echo "❌ 后端package.json不存在：$SERVER_DIR/package.json"
    exit 1
fi

if [ ! -f "$SERVER_DIR/app.js" ]; then
    echo "❌ 后端入口文件不存在：$SERVER_DIR/app.js"
    exit 1
fi

echo "✅ 后端目录结构正确"

# 3. 进入后端目录并安装依赖
echo ""
echo "📦 安装后端依赖..."
cd "$SERVER_DIR"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装npm依赖..."
    npm install
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在，跳过安装"
fi

# 4. 创建必要的目录
echo ""
echo "📁 创建必要目录..."
mkdir -p uploads
mkdir -p logs
echo "✅ 目录创建完成"

# 5. 检查环境变量配置
echo ""
echo "⚙️  检查环境配置..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env文件不存在，使用默认配置"
    # 创建基本的.env文件
    cat > .env << 'EOF'
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置（请根据实际情况修改）
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=learning_platform

# JWT密钥（请修改为随机字符串）
JWT_SECRET=your_jwt_secret_key_here
EOF
    echo "✅ 已创建基本.env文件，请根据需要修改数据库配置"
else
    echo "✅ .env文件已存在"
fi

# 6. 停止可能运行的后端进程
echo ""
echo "🛑 检查并停止现有后端进程..."
if pgrep -f "node.*app.js" >/dev/null; then
    echo "发现运行中的Node.js进程，尝试停止..."
    pkill -f "node.*app.js" || true
    sleep 2
fi

# 检查3001端口是否被占用
if ss -tulpn | grep ":3001 " >/dev/null 2>&1; then
    echo "⚠️  端口3001仍被占用："
    ss -tulpn | grep ":3001 "
    echo "尝试终止占用进程..."
    sudo fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
fi

# 7. 启动后端服务（临时测试）
echo ""
echo "🚀 启动Node后端服务（临时测试）..."

# 设置环境变量并启动
export PORT=3001
export NODE_ENV=production

# 后台启动服务
nohup node app.js > logs/app.log 2>&1 &
BACKEND_PID=$!

echo "✅ 后端服务已启动，PID: $BACKEND_PID"
echo "日志文件：$SERVER_DIR/logs/app.log"

# 8. 等待服务启动并测试
echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 9. 健康检查
echo ""
echo "🏥 执行健康检查..."

# 测试本地连接
if curl -s --connect-timeout 10 http://127.0.0.1:3001/health >/dev/null; then
    echo "✅ 本地健康检查通过"
    
    # 获取健康检查响应详情
    echo "健康检查响应："
    curl -s http://127.0.0.1:3001/health | python3 -m json.tool 2>/dev/null || curl -s http://127.0.0.1:3001/health
else
    echo "❌ 本地健康检查失败"
    echo "查看日志："
    tail -20 logs/app.log
    exit 1
fi

# 10. 显示服务信息
echo ""
echo "📊 后端服务信息："
echo "   - 进程ID: $BACKEND_PID"
echo "   - 监听端口: 3001"
echo "   - 健康检查: http://127.0.0.1:3001/health"
echo "   - API前缀: http://127.0.0.1:3001/api/"
echo "   - 日志文件: $SERVER_DIR/logs/app.log"

# 11. 显示实时日志（最后几行）
echo ""
echo "📜 最新日志："
tail -10 logs/app.log

echo ""
echo "========================================"
echo "✅ 第2步完成！Node后端服务启动成功"
echo ""
echo "🔧 测试命令："
echo "   curl -s http://127.0.0.1:3001/health"
echo ""
echo "📋 下一步：执行 bash deploy-step3-nginx-proxy.sh"
echo "========================================"
