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
    ip: '47.109.142.72',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production'
  });
});

// API状态
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '兴隆场车站班前学习监督系统 - 宝塔服务器运行正常',
    version: '1.0.0',
    server: 'Baota Panel',
    features: {
      hybridStorage: true,
      localStorage: true,
      cloudStorage: false
    },
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
        role: username === 'admin' ? 'admin' : 'user'
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

// 文件上传API示例
app.post('/api/upload', (req, res) => {
  res.json({
    success: true,
    message: '文件上传成功',
    fileId: 'baota-file-' + Date.now(),
    fileUrl: '/uploads/sample-file.pdf'
  });
});

// 获取用户信息
app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      username: 'demo',
      name: '演示用户',
      role: 'user'
    }
  });
});

// SPA路由支持
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('发送index.html失败:', err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>页面加载失败</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .error { background: #f8d7da; padding: 20px; border-radius: 5px; }
                .info { background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="error">
                <h1>页面加载失败</h1>
                <p><strong>错误信息:</strong> ${err.message}</p>
            </div>
            <div class="info">
                <p><strong>项目目录:</strong> ${__dirname}</p>
                <p><strong>dist目录:</strong> ${path.join(__dirname, 'dist')}</p>
                <p><strong>index.html路径:</strong> ${indexPath}</p>
            </div>
            <h3>解决方案:</h3>
            <ol>
                <li>确保dist目录存在</li>
                <li>确保index.html文件存在</li>
                <li>运行: npm run build</li>
                <li>检查文件权限: chmod -R 755 ${path.join(__dirname, 'dist')}</li>
            </ol>
            <p><a href="/health">检查服务器状态</a> | <a href="/api/status">检查API状态</a></p>
        </body>
        </html>
      `);
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试',
    timestamp: new Date().toISOString()
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
  console.log(`🔄 宝塔面板: 已启用静态文件服务`);
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

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  console.log('服务器将继续运行...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  console.log('服务器将继续运行...');
});

module.exports = app;




