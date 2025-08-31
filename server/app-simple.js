const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置 - 简化版
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://127.0.0.1:5173',
      'https://www.liaorenzhi.top',
      'https://liaorenzhi.top',
      'http://116.62.65.246',
      'http://116.62.65.246:3000'
    ];

    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 允许localhost的其他端口
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
    if (localhostPattern.test(origin)) {
      console.log('允许localhost端口访问:', origin);
      return callback(null, true);
    }

    callback(new Error('CORS策略不允许此源'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// 基础中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// 基本健康检查
app.get('/health', cors(corsOptions), (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-simple'
  });
});

app.get('/api/health', cors(corsOptions), (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-simple'
  });
});

// CORS测试接口
app.get('/api/cors-test', cors(corsOptions), (req, res) => {
  res.json({
    message: 'CORS配置正常',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// API路由 - 核心功能
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/articles', require('./routes/articles'));
  app.use('/api/photos', require('./routes/photos'));
  app.use('/api/learning-records', require('./routes/learningRecords'));
  app.use('/api/overview-statistics', require('./routes/overview-statistics'));
  console.log('✅ 所有API路由加载成功');
} catch (error) {
  console.error('⚠️ API路由加载失败:', error.message);
}

// 文件上传功能
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// 文件上传接口
app.post('/api/files/upload', cors(corsOptions), upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    res.json({
      success: true,
      fileUrl: `/api/files/download/${req.file.filename}`,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败: ' + error.message
    });
  }
});

// 文件下载接口
app.get('/api/files/download/:filename', cors(corsOptions), (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({
      success: false,
      error: '文件下载失败'
    });
  }
});

// SPA路由支持
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: '接口不存在' });
  }
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 轻量级服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📊 健康检查: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 CORS测试: http://0.0.0.0:${PORT}/api/cors-test`);
  console.log('✅ 服务器启动完成 - 无Redis/监控系统');
});

module.exports = app;





