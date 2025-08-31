#!/bin/bash

# 部署统计功能到云服务器
echo "=== 开始部署统计功能 ==="

# 服务器配置
SERVER="root@47.108.87.51"
PROJECT_PATH="/www/wwwroot/learning-platform"

# 1. 创建数据库表和视图
echo "1. 创建数据库表和视图..."
ssh $SERVER << 'EOF'
cd /www/wwwroot/learning-platform
mysql -u root -p'Lrz030118@' xuexi_system < create-statistics-tables.sql
if [ $? -eq 0 ]; then
    echo "✅ 数据库表创建成功"
else
    echo "❌ 数据库表创建失败"
    exit 1
fi
EOF

# 2. 上传后端文件
echo "2. 上传统计API文件..."
scp server/routes/statistics.js $SERVER:$PROJECT_PATH/server/routes/
scp server/app.js $SERVER:$PROJECT_PATH/server/

# 3. 上传前端文件
echo "3. 上传前端服务文件..."
scp src/services/statisticsService.ts $SERVER:$PROJECT_PATH/src/services/
scp src/AdminPanel.tsx $SERVER:$PROJECT_PATH/src/

# 4. 上传SQL脚本
echo "4. 上传SQL脚本..."
scp create-statistics-tables.sql $SERVER:$PROJECT_PATH/

# 5. 重启后端服务
echo "5. 重启后端服务..."
ssh $SERVER << 'EOF'
cd /www/wwwroot/learning-platform
pm2 restart ecosystem.config.js
pm2 save
echo "✅ 后端服务已重启"
EOF

# 6. 重新构建前端
echo "6. 重新构建前端..."
ssh $SERVER << 'EOF'
cd /www/wwwroot/learning-platform
npm run build
if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi
EOF

echo "=== 统计功能部署完成 ==="
echo ""
echo "请访问管理员界面查看："
echo "http://47.108.87.51:5173/admin"
echo ""
echo "功能包括："
echo "1. 总用户数、活跃用户数统计"
echo "2. 文章总数、平均完成率统计"
echo "3. 总学习时长、平均成绩统计"
echo "4. 最近学习活动实时显示"
echo "5. 学习排行榜（前10名）"




