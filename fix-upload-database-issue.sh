#!/bin/bash

# 修复文件上传后数据库无记录和乱码问题
# 执行时间: 2025-01-23

echo "====================================="
echo "开始修复文件上传数据库问题..."
echo "====================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 服务器信息
SERVER="root@47.109.142.72"
REMOTE_PATH="/www/wwwroot/learning-platform"

# 1. 上传SQL文件
echo -e "${YELLOW}1. 上传数据库修复SQL文件...${NC}"
scp fix-database-encoding-and-upload.sql $SERVER:$REMOTE_PATH/

# 2. 上传新的文件路由
echo -e "${YELLOW}2. 上传修复后的文件路由...${NC}"
scp server/routes/files-with-article.js $SERVER:$REMOTE_PATH/server/routes/

# 3. 执行远程修复
ssh $SERVER << 'EOF'
cd /www/wwwroot/learning-platform

echo "====================================="
echo "在服务器上执行修复..."
echo "====================================="

# 备份原文件
echo "备份原文件..."
cp server/routes/files-simple.js server/routes/files-simple.js.bak

# 执行数据库修复
echo "执行数据库字符集修复..."
mysql -u root -p'your_password' learning_platform < fix-database-encoding-and-upload.sql

# 更新应用路由
echo "更新应用路由..."
# 需要修改 app.js 或 app-simple.js 使用新的路由文件
sed -i "s/require('\.\/routes\/files-simple')/require('\.\/routes\/files-with-article')/g" server/app.js
sed -i "s/require('\.\/routes\/files-simple')/require('\.\/routes\/files-with-article')/g" server/app-simple.js

# 安装依赖（如果需要）
cd server
npm install uuid --save

# 重启服务
echo "重启Node.js服务..."
pm2 restart all

echo "修复完成！"
EOF

echo -e "${GREEN}====================================="
echo -e "修复脚本执行完成！"
echo -e "=====================================${NC}"

echo ""
echo "请执行以下步骤验证修复效果："
echo "1. 访问 phpMyAdmin 查看 articles 表，确认字符集为 utf8mb4"
echo "2. 上传一个新的中文文件，检查是否能在数据库中看到记录"
echo "3. 检查文章标题是否正确显示（无乱码）"
echo "4. 检查文章分类是否自动识别"

echo ""
echo "如果需要手动执行数据库修复："
echo "mysql -u root -p learning_platform < fix-database-encoding-and-upload.sql"


