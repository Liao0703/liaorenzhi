#!/bin/bash
# 修复服务器文件上传问题的脚本

echo "=== 修复文件上传问题 ==="

# 1. 创建必要的上传目录
echo "1. 创建上传目录..."
mkdir -p /www/wwwroot/learning-platform/server/uploads
mkdir -p /www/wwwroot/learning-platform/uploads

# 2. 设置正确的权限
echo "2. 设置目录权限..."
chmod 755 /www/wwwroot/learning-platform/server/uploads
chmod 755 /www/wwwroot/learning-platform/uploads

# 3. 设置目录所有者（假设使用www-data用户）
echo "3. 设置目录所有者..."
chown -R www-data:www-data /www/wwwroot/learning-platform/server/uploads 2>/dev/null || \
chown -R www:www /www/wwwroot/learning-platform/server/uploads 2>/dev/null || \
echo "跳过所有者设置（需要root权限）"

chown -R www-data:www-data /www/wwwroot/learning-platform/uploads 2>/dev/null || \
chown -R www:www /www/wwwroot/learning-platform/uploads 2>/dev/null || \
echo "跳过所有者设置（需要root权限）"

# 4. 检查环境变量
echo -e "\n4. 检查环境变量..."
cd /www/wwwroot/learning-platform/server
if [ -f .env ]; then
    echo "环境变量文件内容："
    cat .env | grep -E "UPLOAD|PORT|HOST"
else
    echo "未找到.env文件"
fi

# 5. 重启PM2应用
echo -e "\n5. 重启应用..."
pm2 restart learning-platform

# 6. 等待应用启动
sleep 3

# 7. 检查应用状态
echo -e "\n6. 应用状态："
pm2 status learning-platform

# 8. 查看最新日志
echo -e "\n7. 最新日志："
pm2 logs learning-platform --lines 20

echo -e "\n=== 修复完成 ==="
echo "如果问题仍然存在，请检查："
echo "1. 防火墙是否开放了3002端口"
echo "2. Nginx配置是否正确代理到3002端口"
echo "3. 服务器磁盘空间是否充足"
