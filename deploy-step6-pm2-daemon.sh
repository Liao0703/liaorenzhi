#!/bin/bash
# 第6步：让Node后端长期运行（PM2）
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 第6步：配置PM2常驻服务"
echo "========================================"

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"

echo "📁 项目根目录：$PROJECT_ROOT"
echo "📁 后端目录：$SERVER_DIR"

# 1. 检查Node.js环境
echo ""
echo "🟢 检查Node.js环境..."
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js未安装，请先完成第2步"
    exit 1
fi
echo "✅ Node.js版本：$(node -v)"

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm未安装，请检查Node.js安装"
    exit 1
fi
echo "✅ npm版本：$(npm -v)"

# 2. 检查后端目录
echo ""
echo "📂 检查后端目录..."
if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ 后端目录不存在：$SERVER_DIR"
    exit 1
fi

if [ ! -f "$SERVER_DIR/app.js" ]; then
    echo "❌ 后端入口文件不存在：$SERVER_DIR/app.js"
    exit 1
fi
echo "✅ 后端目录结构正确"

# 3. 安装PM2
echo ""
echo "📦 安装PM2..."
if command -v pm2 >/dev/null 2>&1; then
    echo "✅ PM2已安装，版本：$(pm2 -v)"
else
    echo "安装PM2全局包..."
    sudo npm install -g pm2@latest
    echo "✅ PM2安装完成"
fi

# 4. 停止现有的Node进程
echo ""
echo "🛑 停止现有Node进程..."

# 停止可能的PM2进程
if pm2 list | grep -q "learning-api\|app"; then
    echo "停止现有PM2进程..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
fi

# 停止可能的直接运行的Node进程
if pgrep -f "node.*app.js" >/dev/null; then
    echo "停止直接运行的Node进程..."
    pkill -f "node.*app.js" || true
    sleep 2
fi

# 释放3001端口
if ss -tulpn | grep ":3001 " >/dev/null 2>&1; then
    echo "释放3001端口..."
    sudo fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
fi

# 5. 创建PM2配置文件
echo ""
echo "⚙️  创建PM2配置文件..."

cd "$SERVER_DIR"

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'learning-api',
    script: 'app.js',
    cwd: '/home/ubuntu/learning-platform/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 3000,
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# 更新配置文件中的实际路径
sed -i "s|/home/ubuntu/learning-platform/server|$SERVER_DIR|g" ecosystem.config.js

echo "✅ PM2配置文件已创建：ecosystem.config.js"

# 6. 创建日志目录
echo ""
echo "📁 创建日志目录..."
mkdir -p logs
echo "✅ 日志目录已创建：$SERVER_DIR/logs"

# 7. 使用PM2启动应用
echo ""
echo "🚀 使用PM2启动应用..."

# 启动应用
pm2 start ecosystem.config.js --env production

echo "✅ 应用已启动"

# 8. 等待应用启动
echo ""
echo "⏳ 等待应用启动..."
sleep 5

# 9. 检查应用状态
echo ""
echo "📊 检查应用状态..."
pm2 status

# 检查应用是否正在运行
if pm2 list | grep -q "learning-api.*online"; then
    echo "✅ 应用运行正常"
else
    echo "❌ 应用启动失败，查看日志："
    pm2 logs learning-api --lines 20
    exit 1
fi

# 10. 健康检查
echo ""
echo "🏥 执行健康检查..."
sleep 3

if curl -s --connect-timeout 10 http://127.0.0.1:3001/health >/dev/null; then
    echo "✅ 健康检查通过"
    echo "健康检查响应："
    curl -s http://127.0.0.1:3001/health | python3 -m json.tool 2>/dev/null || curl -s http://127.0.0.1:3001/health
else
    echo "❌ 健康检查失败"
    echo "查看应用日志："
    pm2 logs learning-api --lines 10
    exit 1
fi

# 11. 保存PM2配置
echo ""
echo "💾 保存PM2配置..."
pm2 save

echo "✅ PM2配置已保存"

# 12. 配置PM2开机自启
echo ""
echo "🔄 配置PM2开机自启..."

# 生成系统启动脚本
pm2 startup systemd -u $USER --hp $HOME

echo "✅ PM2开机自启已配置"
echo "⚠️  注意：如果上面的命令提示需要运行额外命令，请手动执行"

# 13. 创建PM2管理脚本
echo ""
echo "📝 创建PM2管理脚本..."

cat > pm2-manage.sh << 'EOF'
#!/bin/bash
# PM2管理脚本

case "$1" in
    start)
        echo "启动应用..."
        pm2 start ecosystem.config.js --env production
        ;;
    stop)
        echo "停止应用..."
        pm2 stop learning-api
        ;;
    restart)
        echo "重启应用..."
        pm2 restart learning-api
        ;;
    reload)
        echo "零停机重载应用..."
        pm2 reload learning-api
        ;;
    status)
        echo "应用状态："
        pm2 status
        ;;
    logs)
        echo "查看日志："
        pm2 logs learning-api
        ;;
    monit)
        echo "启动监控界面："
        pm2 monit
        ;;
    delete)
        echo "删除应用..."
        pm2 delete learning-api
        ;;
    health)
        echo "健康检查："
        curl -s http://127.0.0.1:3001/health | python3 -m json.tool 2>/dev/null || curl -s http://127.0.0.1:3001/health
        ;;
    *)
        echo "用法: $0 {start|stop|restart|reload|status|logs|monit|delete|health}"
        echo ""
        echo "命令说明："
        echo "  start   - 启动应用"
        echo "  stop    - 停止应用"
        echo "  restart - 重启应用"
        echo "  reload  - 零停机重载"
        echo "  status  - 查看状态"
        echo "  logs    - 查看日志"
        echo "  monit   - 监控界面"
        echo "  delete  - 删除应用"
        echo "  health  - 健康检查"
        exit 1
        ;;
esac
EOF

chmod +x pm2-manage.sh
echo "✅ PM2管理脚本已创建：pm2-manage.sh"

# 14. 显示PM2配置信息
echo ""
echo "📋 PM2配置信息："
echo "   - 应用名称: learning-api"
echo "   - 端口: 3001"
echo "   - 环境: production"
echo "   - 实例数: 1"
echo "   - 自动重启: 是"
echo "   - 内存限制: 1GB"
echo "   - 日志目录: $SERVER_DIR/logs/"

# 15. 显示管理命令
echo ""
echo "🔧 PM2管理命令："
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs learning-api"
echo "   重启应用: pm2 restart learning-api"
echo "   停止应用: pm2 stop learning-api"
echo "   监控界面: pm2 monit"
echo "   管理脚本: bash pm2-manage.sh status"

# 16. 显示日志文件
echo ""
echo "📜 日志文件位置："
echo "   错误日志: $SERVER_DIR/logs/err.log"
echo "   输出日志: $SERVER_DIR/logs/out.log"
echo "   合并日志: $SERVER_DIR/logs/combined.log"

echo ""
echo "========================================"
echo "✅ 第6步完成！PM2常驻服务配置成功"
echo ""
echo "📊 当前状态："
pm2 status

echo ""
echo "🔧 验证命令："
echo "   curl -s http://127.0.0.1:3001/health"
echo "   curl -s https://api.liaorenzhi.top/health"
echo ""
echo "🎉 所有部署步骤已完成！"
echo "🌐 API服务地址：https://api.liaorenzhi.top"
echo "========================================"
