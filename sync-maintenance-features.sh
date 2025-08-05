#!/bin/bash

# 同步维护人员功能到远程服务器
# 使用方法: ./sync-maintenance-features.sh

SERVER_IP="116.62.65.246"
SERVER_USER="root"
REMOTE_PATH="/root/learning-platform"
LOCAL_PATH="."

echo "🚀 开始同步维护人员功能到远程服务器..."
echo "本地路径: $(pwd)"
echo "远程服务器: $SERVER_USER@$SERVER_IP:$REMOTE_PATH"
echo ""

# 检查SSH连接
echo "1️⃣ 测试SSH连接..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    echo "✅ SSH连接成功"
else
    echo "❌ SSH连接失败"
    exit 1
fi

echo ""
echo "2️⃣ 创建远程备份..."
ssh $SERVER_USER@$SERVER_IP "
    cd $REMOTE_PATH
    echo '创建备份目录...'
    mkdir -p backup/$(date +%Y%m%d_%H%M%S)
    
    echo '备份现有文件...'
    if [ -d src ]; then
        cp -r src backup/$(date +%Y%m%d_%H%M%S)/src_backup
        echo '✅ 源码已备份'
    fi
    
    if [ -f package.json ]; then
        cp package.json backup/$(date +%Y%m%d_%H%M%S)/
        echo '✅ package.json已备份'
    fi
"

echo ""
echo "3️⃣ 同步维护功能文件..."

# 同步维护相关的tsx文件
echo "上传维护管理组件..."
scp src/MaintenanceAdminPanel.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/
scp src/MaintenanceAdminSimple.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/
scp src/MaintenanceAdminTest.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/
scp src/MaintenancePanel.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/
scp src/MaintenancePage.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/
scp src/MaintenanceTest.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/
scp src/maintenanceService.ts $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/

echo "✅ 维护组件已上传"

# 检查并同步UserManagement组件
echo ""
echo "检查用户管理组件..."
if [ -f "src/components/UserManagement.tsx" ]; then
    echo "上传用户管理组件..."
    ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_PATH/src/components"
    scp src/components/UserManagement.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/components/
    echo "✅ 用户管理组件已上传"
else
    echo "⚠️ 用户管理组件不存在，需要手动创建"
fi

# 同步App.tsx（包含路由配置）
echo ""
echo "上传App.tsx（路由配置）..."
scp src/App.tsx $SERVER_USER@$SERVER_IP:$REMOTE_PATH/src/
echo "✅ App.tsx已上传"

# 同步package.json（如果有新依赖）
echo ""
echo "上传package.json..."
scp package.json $SERVER_USER@$SERVER_IP:$REMOTE_PATH/
echo "✅ package.json已上传"

echo ""
echo "4️⃣ 检查文件完整性..."
ssh $SERVER_USER@$SERVER_IP "
    cd $REMOTE_PATH
    
    echo '检查维护相关文件:'
    ls -la src/*[Mm]aintenance* 2>/dev/null || echo '未找到维护文件'
    
    echo ''
    echo '检查用户管理组件:'
    ls -la src/components/UserManagement.tsx 2>/dev/null || echo '用户管理组件不存在'
    
    echo ''
    echo '检查App.tsx:'
    ls -la src/App.tsx
"

echo ""
echo "5️⃣ 安装依赖和重新构建..."
ssh $SERVER_USER@$SERVER_IP "
    cd $REMOTE_PATH
    
    echo '安装/更新依赖...'
    npm install
    
    echo ''
    echo '构建项目...'
    npm run build
    
    echo ''
    echo '检查构建结果:'
    if [ -d dist ]; then
        echo '✅ 构建成功，dist目录存在'
        ls -la dist/ | head -5
    else
        echo '❌ 构建失败，dist目录不存在'
        exit 1
    fi
"

echo ""
echo "6️⃣ 重启服务..."
ssh $SERVER_USER@$SERVER_IP "
    cd $REMOTE_PATH
    
    echo '重启PM2服务...'
    pm2 restart learning-platform
    
    echo '等待服务启动...'
    sleep 3
    
    echo 'PM2状态:'
    pm2 status
    
    echo ''
    echo '检查3000端口:'
    netstat -tlnp | grep 3000
"

echo ""
echo "7️⃣ 验证部署..."
sleep 3

echo "测试前端访问..."
if curl -s -I http://$SERVER_IP/ --connect-timeout 10 | head -1; then
    echo "✅ 前端访问正常"
else
    echo "❌ 前端访问失败"
fi

echo ""
echo "测试API访问..."
if curl -s -I http://$SERVER_IP:3000/ --connect-timeout 10 | head -1; then
    echo "✅ API访问正常"
else
    echo "❌ API访问失败"
fi

echo ""
echo "🎉 维护功能同步完成！"
echo ""
echo "📋 访问地址："
echo "🌐 前端: http://$SERVER_IP/"
echo "🔧 管理后台: http://$SERVER_IP:3000/admin"
echo "👥 维护管理: http://$SERVER_IP/maintenance-admin"
echo "🧪 测试页面: http://$SERVER_IP/maintenance-test"
echo "📱 独立页面: http://$SERVER_IP/maintenance-simple"
echo ""
echo "📝 如果遇到问题，可以查看日志:"
echo "ssh $SERVER_USER@$SERVER_IP 'pm2 logs learning-platform'" 