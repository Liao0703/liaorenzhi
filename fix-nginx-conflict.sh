#!/bin/bash

# 修复宝塔Nginx配置冲突脚本
echo "🔧 修复Nginx配置冲突"
echo "====================="
echo ""

# 服务器信息
SERVER="root@47.109.142.72"

echo "请通过SSH连接到服务器执行以下命令："
echo ""
echo "ssh $SERVER"
echo ""
echo "然后执行以下步骤："
echo ""
echo "=== 步骤1：备份并删除冲突的配置文件 ==="
echo ""
cat << 'EOF'
# 1. 备份现有配置
cp /www/server/panel/vhost/nginx/node_learning_platform.conf /www/server/panel/vhost/nginx/node_learning_platform.conf.bak

# 2. 删除Node.js项目自动生成的配置文件
rm -f /www/server/panel/vhost/nginx/node_learning_platform.conf

# 3. 检查是否还有其他冲突文件
ls -la /www/server/panel/vhost/nginx/ | grep -E "learning|47.109"

# 4. 如果有其他相关配置文件，也需要删除
# rm -f /www/server/panel/vhost/nginx/[其他冲突文件名]

# 5. 测试Nginx配置
nginx -t

# 6. 重载Nginx
nginx -s reload
EOF

echo ""
echo "=== 步骤2：在宝塔面板重新创建网站 ==="
echo ""
echo "1. 返回宝塔面板"
echo "2. 点击'网站' -> '添加站点'"
echo "3. 填写信息："
echo "   - 域名：47.109.142.72"
echo "   - 根目录：/www/wwwroot/learning-platform"
echo "   - PHP版本：选择'纯静态'"
echo "   - 数据库：不创建"
echo "   - FTP：不创建"
echo ""
echo "4. 创建成功后，点击网站的'设置'按钮"
echo "5. 在'网站目录'标签页："
echo "   - 运行目录：设置为 /dist"
echo "   - 防跨站攻击：关闭"
echo "6. 点击保存"
echo ""
echo "=== 步骤3：配置伪静态规则 ==="
echo ""
echo "在网站设置中，点击'伪静态'标签页，输入以下规则："
echo ""
cat << 'EOF'
location / {
    try_files $uri $uri/ /index.html;
}

location ^~ /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

location /health {
    proxy_pass http://127.0.0.1:3001/health;
}
EOF

echo ""
echo "=== 步骤4：检查Node.js项目状态 ==="
echo ""
echo "1. 在宝塔面板点击'Node项目'"
echo "2. 确保learning_platform项目状态为'运行中'"
echo "3. 如果未运行，点击'启动'按钮"
echo ""
echo "=== 完成后测试 ==="
echo ""
echo "访问：http://47.109.142.72"
echo "应该能看到网站首页"





