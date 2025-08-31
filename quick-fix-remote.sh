#!/bin/bash

# 快速远程修复脚本
# 在本地执行，自动SSH到服务器修复

SERVER="47.109.142.72"
echo "======================================"
echo "快速修复宝塔服务器MySQL问题"
echo "服务器: $SERVER"
echo "======================================"

# 上传修复脚本
echo "上传修复脚本..."
scp fix-baota-final.sh root@$SERVER:/tmp/

# SSH执行修复
echo "连接服务器执行修复..."
ssh root@$SERVER << 'REMOTE_CMD'

# 执行修复脚本
cd /tmp
chmod +x fix-baota-final.sh
./fix-baota-final.sh

# 额外的快速检查
echo -e "\n快速验证："
mysql -u root -pLiao0820 -e "USE learning_platform; SELECT COUNT(*) as total FROM users;" 2>/dev/null

# 检查服务状态
echo -e "\n服务状态："
ps aux | grep -E "node.*app.js" | grep -v grep

echo -e "\n端口监听："
netstat -tlnp | grep 3001

REMOTE_CMD

echo ""
echo "======================================"
echo "远程修复完成！"
echo "======================================"
echo ""
echo "下一步："
echo "1. 访问 http://$SERVER 测试网站"
echo "2. 尝试注册新用户"
echo "3. 访问 http://$SERVER/phpmyadmin 查看数据"
echo "   用户名: root"
echo "   密码: Liao0820"

