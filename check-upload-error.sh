#!/bin/bash
# 服务器上检查上传错误的脚本

echo "=== 检查文件上传错误 ==="

# 1. 查看PM2日志
echo -e "\n1. PM2日志（最近50行）："
pm2 logs learning-platform --lines 50 --err

# 2. 检查上传目录权限
echo -e "\n2. 检查上传目录权限："
ls -la /www/wwwroot/learning-platform/server/uploads/
ls -la /www/wwwroot/learning-platform/uploads/

# 3. 检查磁盘空间
echo -e "\n3. 磁盘空间："
df -h

# 4. 检查nginx错误日志
echo -e "\n4. Nginx错误日志（如果使用nginx）："
tail -n 50 /var/log/nginx/error.log 2>/dev/null || echo "未找到nginx日志"

# 5. 检查系统日志
echo -e "\n5. 系统日志："
journalctl -u pm2-$(whoami) -n 50 --no-pager 2>/dev/null || echo "未找到系统日志"

# 6. 检查文件上传相关的环境变量
echo -e "\n6. 环境变量："
pm2 env learning-platform | grep -i upload

# 7. 检查进程状态
echo -e "\n7. PM2进程状态："
pm2 describe learning-platform

echo -e "\n=== 检查完成 ==="
