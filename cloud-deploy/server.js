import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// API 路由可以在这里添加
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '学习平台服务器运行正常',
    version: '1.0.0'
  });
});

// 所有其他路由都返回 index.html（SPA 支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器启动成功！`);
  console.log(`📁 项目目录: ${__dirname}`);
  console.log(`🌐 本地访问: http://localhost:${PORT}`);
  console.log(`🔧 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 API状态: http://localhost:${PORT}/api/status`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
}); 