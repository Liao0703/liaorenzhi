#!/bin/bash
# 修复服务器CORS问题的脚本

echo "=== 修复CORS跨域问题 ==="

# 提示用户输入域名
echo "请输入您的网站域名（例如：https://yourdomain.com）："
read DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "错误：域名不能为空"
    exit 1
fi

# 备份原始文件
echo "1. 备份原始配置文件..."
cd /www/wwwroot/learning-platform/server
cp app.js app.js.backup.$(date +%Y%m%d_%H%M%S)

# 添加域名到CORS允许列表
echo "2. 更新CORS配置..."
# 在allowedOrigins数组中添加新域名
sed -i "/const allowedOrigins = \[/,/\];/ {
    /http:\/\/127.0.0.1:3002',/a\\
      // 生产环境\\
      '$DOMAIN',
}" app.js

# 创建或更新.env文件
echo "3. 更新环境变量..."
if [ -f .env ]; then
    # 检查是否已存在ALLOWED_ORIGINS
    if grep -q "ALLOWED_ORIGINS" .env; then
        # 更新现有的ALLOWED_ORIGINS
        sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$DOMAIN|" .env
    else
        # 添加新的ALLOWED_ORIGINS
        echo "ALLOWED_ORIGINS=$DOMAIN" >> .env
    fi
else
    # 创建新的.env文件
    echo "ALLOWED_ORIGINS=$DOMAIN" > .env
fi

# 重启PM2应用
echo "4. 重启应用..."
npx pm2 restart learning-platform

# 等待应用启动
sleep 3

# 检查应用状态
echo -e "\n5. 应用状态："
npx pm2 status learning-platform

# 测试CORS
echo -e "\n6. 测试CORS配置..."
curl -H "Origin: $DOMAIN" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3002/api/files/upload \
     -v 2>&1 | grep -i "access-control"

echo -e "\n=== 修复完成 ==="
echo "请在浏览器中测试文件上传功能"
