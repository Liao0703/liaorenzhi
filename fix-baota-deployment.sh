#!/bin/bash

# 宝塔部署问题修复脚本
# 服务器IP: 47.109.142.72

echo "🔧 开始修复宝塔部署问题..."

# 配置变量
SERVER_IP="47.109.142.72"
PROJECT_DIR="/www/wwwroot/learning-platform"
SERVER_PORT="3001"

echo "📋 宝塔部署问题诊断和修复"
echo "服务器IP: $SERVER_IP"
echo "项目目录: $PROJECT_DIR"
echo "后端端口: $SERVER_PORT"
echo "================================"

# 1. 检查项目目录
echo "1. 📁 检查项目目录..."
if [ -d "$PROJECT_DIR" ]; then
    echo "✅ 项目目录存在: $PROJECT_DIR"
    ls -la $PROJECT_DIR
else
    echo "❌ 项目目录不存在，正在创建..."
    mkdir -p $PROJECT_DIR
fi

# 2. 检查Node.js服务
echo ""
echo "2. 🔍 检查Node.js服务状态..."
pm2 status
echo ""

# 3. 检查端口占用
echo "3. 🌐 检查端口占用情况..."
echo "检查端口80 (前端):"
netstat -tlnp | grep :80 || echo "端口80未被占用"
echo "检查端口3001 (后端):"
netstat -tlnp | grep :3001 || echo "端口3001未被占用"
echo ""

# 4. 检查防火墙
echo "4. 🛡️ 检查防火墙状态..."
if command -v ufw &> /dev/null; then
    ufw status
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --list-all
else
    echo "未检测到防火墙管理工具"
fi
echo ""

# 5. 创建简化的服务器配置
echo "5. ⚙️ 创建宝塔专用服务器配置..."
cat > $PROJECT_DIR/server-baota.js << 'EOF'
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 静态文件服务 - 修复MIME类型问题
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
    if (filepath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    }
  }
}));

// favicon处理
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    server: '宝塔服务器',
    ip: '47.109.142.72'
  });
});

// API状态
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '兴隆场车站班前学习监督系统 - 宝塔服务器运行正常',
    version: '1.0.0',
    server: 'Baota Panel',
    timestamp: new Date().toISOString()
  });
});

// 简单登录API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username && password) {
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: 1,
        username: username,
        name: username,
        role: 'user'
      },
      token: 'baota-token-' + Date.now()
    });
  } else {
    res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }
});

// SPA路由支持
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('发送index.html失败:', err);
      res.status(500).send(`
        <h1>页面加载失败</h1>
        <p>项目目录: ${__dirname}</p>
        <p>dist目录: ${path.join(__dirname, 'dist')}</p>
        <p>错误: ${err.message}</p>
      `);
    }
  });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 宝塔服务器启动成功！`);
  console.log(`📁 项目目录: ${__dirname}`);
  console.log(`🌐 内网访问: http://localhost:${PORT}`);
  console.log(`🌍 外网访问: http://47.109.142.72`);
  console.log(`🔧 健康检查: http://47.109.142.72/health`);
  console.log(`📊 API状态: http://47.109.142.72/api/status`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
  console.log('================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('宝塔服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('宝塔服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
EOF

# 6. 创建宝塔专用PM2配置
echo "6. 📝 创建PM2配置..."
cat > $PROJECT_DIR/ecosystem-baota.config.js << EOF
module.exports = {
  apps: [{
    name: 'learning-platform-baota',
    script: './server-baota.js',
    cwd: '$PROJECT_DIR',
    env: {
      NODE_ENV: 'production',
      PORT: '$SERVER_PORT'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/baota-err.log',
    out_file: './logs/baota-out.log',
    log_file: './logs/baota-combined.log',
    time: true,
    restart_delay: 2000,
    max_restarts: 5
  }]
};
EOF

# 7. 创建Nginx配置
echo "7. 🌐 创建Nginx配置..."
cat > $PROJECT_DIR/nginx-baota-simple.conf << EOF
server {
    listen 80;
    server_name $SERVER_IP;
    root $PROJECT_DIR/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # 修复JavaScript MIME类型问题
        location ~* \.js\$ {
            add_header Content-Type "application/javascript; charset=UTF-8";
            add_header X-Content-Type-Options "nosniff";
            expires 1d;
        }
        
        location ~* \.css\$ {
            add_header Content-Type "text/css; charset=UTF-8";
            expires 1d;
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:$SERVER_PORT/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:$SERVER_PORT/health;
    }

    # favicon
    location /favicon.ico {
        return 204;
        access_log off;
    }
}
EOF

# 8. 创建日志目录
mkdir -p $PROJECT_DIR/logs

echo ""
echo "✅ 修复脚本执行完成！"
echo ""
echo "📋 接下来的手动操作："
echo "1. 上传项目文件到: $PROJECT_DIR"
echo "2. 确保dist目录存在并包含前端文件"
echo "3. 在宝塔面板中："
echo "   - 网站 → 添加站点 → 域名: $SERVER_IP"
echo "   - 根目录: $PROJECT_DIR/dist"
echo "   - 配置文件: 复制 nginx-baota-simple.conf 内容"
echo "4. 启动后端服务:"
echo "   cd $PROJECT_DIR"
echo "   pm2 start ecosystem-baota.config.js"
echo "5. 检查服务状态:"
echo "   pm2 status"
echo "   curl http://localhost:$SERVER_PORT/health"
echo ""
echo "🌍 完成后访问: http://$SERVER_IP"
EOF

chmod +x /Users/renzhiliao/Desktop/learning-platform/fix-baota-deployment.sh