#!/bin/bash

# 宝塔部署脚本 - 兴隆场车站班前学习监督系统
# 使用说明：将此脚本上传到宝塔服务器并执行

echo "🚀 开始部署兴隆场车站班前学习监督系统到宝塔面板..."

# 配置变量
PROJECT_DIR="/www/wwwroot/learning-platform"
DOMAIN_IP="您的服务器IP"  # 请替换为实际IP
SERVER_PORT="3001"
FRONTEND_PORT="80"

# 1. 创建项目目录
echo "📁 创建项目目录..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 2. 停止现有服务（如果存在）
echo "🛑 停止现有服务..."
pm2 stop learning-platform-server 2>/dev/null || true
pm2 delete learning-platform-server 2>/dev/null || true

# 3. 清理旧文件
echo "🧹 清理旧文件..."
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json

# 4. 安装后端依赖
echo "📦 安装后端依赖..."
cd server
npm cache clean --force
npm install --production

# 5. 配置环境变量
echo "⚙️ 配置环境变量..."
cat > .env << EOF
NODE_ENV=production
PORT=$SERVER_PORT
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=您的数据库密码
DB_NAME=learning_platform
JWT_SECRET=your-secret-key-here
EOF

echo "✅ 请手动编辑 server/.env 文件，填入正确的数据库信息"

# 6. 创建PM2配置文件
echo "🔧 创建PM2配置..."
cd $PROJECT_DIR
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'learning-platform-server',
    script: './server/app.js',
    cwd: '$PROJECT_DIR',
    env: {
      NODE_ENV: 'production',
      PORT: '$SERVER_PORT'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 7. 创建日志目录
mkdir -p logs

# 8. 启动后端服务
echo "🚀 启动后端服务..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 9. 创建Nginx配置文件
echo "🌐 创建Nginx配置..."
cat > nginx-learning-platform.conf << EOF
server {
    listen 80;
    server_name $DOMAIN_IP;
    root $PROJECT_DIR/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # 设置正确的MIME类型
        location ~* \.js\$ {
            add_header Content-Type "text/javascript; charset=UTF-8";
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.css\$ {
            add_header Content-Type "text/css; charset=UTF-8";
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:$SERVER_PORT/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:$SERVER_PORT/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # 处理favicon.ico
    location /favicon.ico {
        return 204;
        access_log off;
        log_not_found off;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

echo "📋 部署完成！接下来的手动操作："
echo ""
echo "1. 🔧 在宝塔面板中："
echo "   - 网站 → 添加站点 → 域名: $DOMAIN_IP"
echo "   - 根目录设置为: $PROJECT_DIR/dist"
echo ""
echo "2. 🌐 配置Nginx："
echo "   - 复制 nginx-learning-platform.conf 内容"
echo "   - 粘贴到宝塔面板 → 网站 → 设置 → 配置文件"
echo ""
echo "3. 📁 上传前端文件："
echo "   - 将本地构建的 dist 目录上传到: $PROJECT_DIR/"
echo "   - 或者在服务器上执行: npm run build"
echo ""
echo "4. 🗄️ 配置数据库："
echo "   - 编辑 server/.env 文件"
echo "   - 设置正确的数据库连接信息"
echo ""
echo "5. ✅ 验证部署："
echo "   - 检查后端: pm2 status"
echo "   - 测试API: curl http://localhost:$SERVER_PORT/health"
echo "   - 访问前端: http://$DOMAIN_IP"
echo ""
echo "🔍 查看日志: pm2 logs learning-platform-server"
echo "🔄 重启服务: pm2 restart learning-platform-server"
