const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      // 本地
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:8080',
      'http://localhost:3002',
      'http://localhost:4000',
      'http://localhost:8000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:8000',
      // 生产域名（HTTPS）
      'https://www.liaorenzhi.top',
      'https://liaorenzhi.top',
      'https://api.liaorenzhi.top',
      // 服务器直连（如需）
      'http://116.62.65.246',
      'http://116.62.65.246:3000',
      // Vercel 预览域名
      'https://learning-platform.vercel.app'
    ];

    // 内网穿透服务的域名模式
    const tunnelPatterns = [
      /^https?:\/\/[\w\-\.]+\.ngrok\.io$/,
      /^https?:\/\/[\w\-\.]+\.frp\.io$/,
      /^https?:\/\/[\w\-\.]+\.natapp\.cc$/,
      /^https?:\/\/[\w\-\.]+\.tunnel\.me$/,
      /^https?:\/\/[\w\-\.]+\.localtunnel\.me$/,
      /^https?:\/\/[\w\-\.]+\.serveo\.net$/
    ];

    // 如果没有origin（比如直接访问API），允许
    if (!origin) return callback(null, true);

    // 检查是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 检查是否匹配内网穿透模式
    const isTunnelOrigin = tunnelPatterns.some(pattern => pattern.test(origin));
    if (isTunnelOrigin) {
      console.log('允许内网穿透访问:', origin);
      return callback(null, true);
    }

    // 放行 Vercel 预览域名
    const vercelPreviewPattern = /^https?:\/\/[\w\-]+\.vercel\.app$/;
    if (vercelPreviewPattern.test(origin)) {
      console.log('允许 Vercel 预览域名访问:', origin);
      return callback(null, true);
    }

    // 检查是否是localhost的其他端口
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
    if (localhostPattern.test(origin)) {
      console.log('允许localhost端口访问:', origin);
      return callback(null, true);
    }

    console.log('拒绝的源:', origin);
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

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      connectSrc: ["'self'", "http:", "https:"]
    }
  }
}));
app.use(cors(corsOptions));

// 处理OPTIONS预检请求
app.options('*', cors(corsOptions));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由配置
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/learning-records', require('./routes/learningRecords'));

// 文件上传路由
const multer = require('multer');
const fs = require('fs');

// 配置文件存储
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
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 文件上传接口
app.post('/api/files/upload', cors(corsOptions), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    console.log('文件上传成功:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });

    // 返回相对路径，前端会根据环境补全为正确域名与协议
    res.json({
      success: true,
      fileUrl: `/api/files/download/${req.file.filename}`,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileId: Date.now() // 临时ID
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

// 健康检查
app.get('/health', cors(corsOptions), (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', cors(corsOptions), (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📊 健康检查: http://0.0.0.0:${PORT}/health`);
});

module.exports = app;
