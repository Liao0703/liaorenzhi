#!/bin/bash

# 部署真实用户管理页面到服务器
echo "======================================"
echo "部署真实用户管理系统"
echo "======================================"
echo ""

SERVER="47.109.142.72"
PROJECT_PATH="/www/wwwroot/learning-platform"

# 1. 上传文件到服务器
echo "[1] 上传文件到服务器..."
scp maintenance-users-real.html root@$SERVER:$PROJECT_PATH/
scp 维护人员用户管理真实数据库方案.md root@$SERVER:$PROJECT_PATH/

echo "✅ 文件上传完成"

# 2. 在服务器上配置
echo ""
echo "[2] 配置服务器..."
ssh root@$SERVER << 'REMOTE_SETUP'
cd /www/wwwroot/learning-platform

# 确保文件权限正确
chmod 644 maintenance-users-real.html

# 创建访问链接
echo "创建快速访问链接..."
cat > quick-access-real-users.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>跳转到用户管理</title>
    <script>
        // 自动跳转到真实用户管理页面
        window.location.href = '/maintenance-users-real.html';
    </script>
</head>
<body>
    <p>正在跳转到用户管理页面...</p>
    <p>如果没有自动跳转，请<a href="/maintenance-users-real.html">点击这里</a></p>
</body>
</html>
HTML

echo "✅ 配置完成"
REMOTE_SETUP

# 3. 测试访问
echo ""
echo "[3] 测试页面访问..."
curl -s -o /dev/null -w "%{http_code}" http://$SERVER/maintenance-users-real.html > /tmp/status_code
STATUS=$(cat /tmp/status_code)

if [ "$STATUS" = "200" ]; then
    echo "✅ 页面访问正常 (HTTP $STATUS)"
else
    echo "⚠️ 页面访问异常 (HTTP $STATUS)"
fi

# 4. 显示访问信息
echo ""
echo "======================================"
echo "✅ 部署完成！"
echo "======================================"
echo ""
echo "📌 访问方式："
echo ""
echo "1. 直接访问用户管理页面："
echo "   http://$SERVER/maintenance-users-real.html"
echo ""
echo "2. 使用步骤："
echo "   a) 先登录系统（使用维护人员或管理员账号）"
echo "   b) 访问上述链接"
echo "   c) 即可看到真实的数据库用户数据"
echo ""
echo "3. 测试账号："
echo "   维护人员：maintenance / 123456"
echo "   管理员：admin / admin123"
echo ""
echo "4. 功能说明："
echo "   - 实时显示数据库中的所有用户"
echo "   - 可以添加、编辑、删除用户"
echo "   - 可以重置用户密码"
echo "   - 可以修改用户角色"
echo "   - 支持搜索和筛选"
echo ""
echo "5. 注意事项："
echo "   ⚠️ 所有操作直接作用于真实数据库"
echo "   ⚠️ 删除操作不可恢复，请谨慎操作"
echo "   ⚠️ 建议定期备份数据库"
echo ""
echo "======================================"
