const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// CORS 支持
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

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 状态检查
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '兴隆场车站班前学习监督系统服务器运行正常',
    version: '1.0.0',
    features: {
      hybridStorage: true,
      localStorage: true,
      cloudStorage: true
    },
    timestamp: new Date().toISOString()
  });
});

// 简单的认证API示例（实际项目中需要更完善的认证）
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 这里只是示例，实际应该连接数据库验证
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
      token: 'sample-token-' + Date.now()
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
    fileId: 'file-' + Date.now(),
    fileUrl: '/uploads/sample-file.pdf'
  });
});

// 所有其他路由都返回 index.html（SPA 支持）
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('发送index.html失败:', err);
      res.status(500).send('页面加载失败');
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 兴隆场车站班前学习监督系统启动成功！`);
  console.log(`📁 项目目录: ${__dirname}`);
  console.log(`🌐 本地访问: http://localhost:${PORT}`);
  console.log(`🌍 外部访问: http://0.0.0.0:${PORT}`);
  console.log(`🔧 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 API状态: http://localhost:${PORT}/api/status`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
  console.log(`🔄 混合存储: 已启用本地存储 + 云服务器`);
  console.log('================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});