const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Swagger API文档配置
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');

// Redis缓存配置
const { initRedis, cacheClient } = require('./config/redis');
const { cacheService } = require('./services/cacheService');
const { apiCache, cacheStats, cacheInvalidation } = require('./middleware/cache');

// 监控系统配置
const { monitoringService } = require('./services/monitoringService');
const { alertManager } = require('./services/alertManager');
const { 
  requestMonitoring, 
  errorMonitoring, 
  healthCheckEnhancer,
  monitoringAPI,
  monitoringConfig,
  performanceStats
} = require('./middleware/monitoring');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置
const parseEnvOrigins = () => {
  const env = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '';
  return String(env)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表（支持环境变量追加）
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
      'https://learning-platform.vercel.app',
      ...parseEnvOrigins()
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

    // 允许常见内网网段（仅限 http，若需 https 也可匹配）
    const intranetPattern = /^https?:\/\/(10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3})\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.(?:\d{1,3})\.\d{1,3})(?::\d+)?$/;
    if (intranetPattern.test(origin)) {
      console.log('允许内网网段来源:', origin);
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

// 缓存统计中间件
app.use(cacheStats());

// 监控中间件
app.use(requestMonitoring());
app.use(performanceStats());
app.use(healthCheckEnhancer());
app.use(monitoringAPI());
app.use(monitoringConfig());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 前端静态文件服务 - 提供Vue.js构建的SPA
app.use(express.static(path.join(__dirname, '..', 'dist')));

// 监控面板
app.get('/monitoring', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'monitoring-dashboard.html'));
});

// API文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// API规范JSON（供第三方工具使用）
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [系统监控]
 *     summary: 健康检查
 *     description: 检查服务器运行状态
 *     responses:
 *       200:
 *         description: 服务器运行正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */

// 路由配置
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/learning-records', require('./routes/learningRecords'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/overview-statistics', require('./routes/overview-statistics'));

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

// 文件上传接口 - 修复：添加数据库记录
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

    // 获取用户信息（从请求头或会话中）
    const userId = req.headers['user-id'] || req.body.userId || 1; // 默认用户ID
    
    // 确定文件类型
    let uploadType = 'document';
    const mimeType = req.file.mimetype;
    if (mimeType.startsWith('image/')) {
      uploadType = 'image';
    } else if (mimeType.startsWith('video/')) {
      uploadType = 'video';
    }

    // 将文件记录保存到数据库
    const { pool } = require('./config/database');
    let fileId;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO uploaded_files 
         (user_id, filename, original_name, file_type, file_size, file_path, upload_type, processing_status, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          req.file.filename,
          req.file.originalname,
          mimeType,
          req.file.size,
          req.file.path,
          uploadType,
          'processed',
          JSON.stringify({
            uploadTime: new Date().toISOString(),
            serverPath: req.file.path,
            destination: req.file.destination
          })
        ]
      );
      fileId = result.insertId;
      console.log('✅ 文件记录已保存到云数据库，ID:', fileId);
    } catch (dbError) {
      console.warn('⚠️ 数据库保存失败，使用内存存储:', dbError.message);
      fileId = Date.now(); // 降级使用时间戳作为ID
    }

    // 返回相对路径，前端会根据环境补全为正确域名与协议
    res.json({
      success: true,
      fileId: fileId,
      fileUrl: `/api/files/download/${req.file.filename}`,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: mimeType,
      uploadType: uploadType,
      uploadTime: new Date().toISOString(),
      stored: 'database' // 标识已存储到数据库
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败: ' + error.message
    });
  }
});

// 文件下载接口 - 优化：从数据库查询文件信息
app.get('/api/files/download/:filename', cors(corsOptions), async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // 先从数据库查询文件信息
    const { pool } = require('./config/database');
    let fileRecord = null;
    
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM uploaded_files WHERE filename = ? AND processing_status = "processed"',
        [filename]
      );
      fileRecord = rows[0];
    } catch (dbError) {
      console.warn('⚠️ 数据库查询失败，使用本地文件:', dbError.message);
    }

    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    // 获取文件扩展名来设置正确的Content-Type
    let contentType = 'application/octet-stream';
    
    if (fileRecord && fileRecord.file_type) {
      contentType = fileRecord.file_type;
    } else {
      // 降级：根据扩展名推测Content-Type
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (ext === '.doc') {
        contentType = 'application/msword';
      } else if (ext === '.txt') {
        contentType = 'text/plain';
      }
    }

    res.setHeader('Content-Type', contentType);
    // 使用原始文件名（如果有的话）
    const displayName = fileRecord?.original_name || filename;
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(displayName)}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('✅ 文件下载成功:', displayName);

  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({
      success: false,
      error: '文件下载失败'
    });
  }
});

// 文件列表接口 - 从数据库获取文件列表
app.get('/api/files/list', cors(corsOptions), async (req, res) => {
  try {
    const { userId, uploadType, limit = 50, offset = 0 } = req.query;
    const { pool } = require('./config/database');
    
    let query = `SELECT id, filename, original_name, file_type, file_size, upload_type, 
                        created_at, user_id, processing_status 
                 FROM uploaded_files WHERE processing_status = 'processed'`;
    const params = [];
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (uploadType) {
      query += ' AND upload_type = ?';
      params.push(uploadType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    try {
      const [rows] = await pool.execute(query, params);
      
      // 检查文件是否实际存在于磁盘
      const filesWithStatus = await Promise.all(rows.map(async (file) => {
        const filePath = path.join(__dirname, 'uploads', file.filename);
        const exists = fs.existsSync(filePath);
        
        return {
          id: file.id,
          filename: file.filename,
          originalName: file.original_name,
          fileType: file.file_type,
          fileSize: file.file_size,
          uploadType: file.upload_type,
          uploadTime: file.created_at,
          userId: file.user_id,
          downloadUrl: `/api/files/download/${file.filename}`,
          previewUrl: `/api/files/preview/${file.filename}`,
          exists: exists,
          status: exists ? 'available' : 'missing'
        };
      }));
      
      res.json({
        success: true,
        files: filesWithStatus,
        total: filesWithStatus.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (dbError) {
      console.warn('⚠️ 数据库查询失败，降级到本地文件扫描:', dbError.message);
      
      // 降级：扫描本地uploads目录
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        return res.json({ success: true, files: [], total: 0 });
      }
      
      const files = fs.readdirSync(uploadDir).map(filename => {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename: filename,
          originalName: filename,
          fileSize: stats.size,
          uploadTime: stats.birthtime.toISOString(),
          downloadUrl: `/api/files/download/${filename}`,
          previewUrl: `/api/files/preview/${filename}`,
          exists: true,
          status: 'available'
        };
      });
      
      res.json({
        success: true,
        files: files.slice(offset, offset + limit),
        total: files.length,
        source: 'local_scan'
      });
    }
    
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文件列表失败'
    });
  }
});

// 文件删除接口 - 同时删除数据库记录和本地文件
app.delete('/api/files/delete/:filename', cors(corsOptions), async (req, res) => {
  try {
    const filename = req.params.filename;
    const { pool } = require('./config/database');
    
    // 先从数据库删除记录
    try {
      const [result] = await pool.execute(
        'DELETE FROM uploaded_files WHERE filename = ?',
        [filename]
      );
      console.log('✅ 数据库记录删除成功，影响行数:', result.affectedRows);
    } catch (dbError) {
      console.warn('⚠️ 数据库删除失败:', dbError.message);
    }
    
    // 删除本地文件
    const filePath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ 本地文件删除成功:', filename);
    }
    
    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('文件删除失败:', error);
    res.status(500).json({
      success: false,
      error: '文件删除失败'
    });
  }
});

// 健康检查
app.get('/health', cors(corsOptions), async (req, res) => {
  const cacheHealth = await cacheService.healthCheck();
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cache: cacheHealth
  });
});

app.get('/api/health', cors(corsOptions), async (req, res) => {
  const cacheHealth = await cacheService.healthCheck();
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cache: cacheHealth
  });
});

// API状态检查接口
app.get('/api/status', cors(corsOptions), async (req, res) => {
  try {
    const cacheHealth = await cacheService.healthCheck();
    
    // 检查各个API模块状态
    const apiStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        auth: 'online',
        users: 'online',
        articles: 'online', 
        photos: 'online',
        learningRecords: 'online',
        cache: cacheHealth.status
      },
      endpoints: [
        '/api/auth/*',
        '/api/users/*', 
        '/api/articles/*',
        '/api/photos/*',
        '/api/learning-records/*'
      ]
    };
    
    res.json(apiStatus);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// CORS测试接口
app.get('/api/cors-test', cors(corsOptions), (req, res) => {
  res.json({
    message: 'CORS配置正常',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// 缓存管理接口
app.get('/api/cache/stats', cors(corsOptions), async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取缓存统计失败',
      message: error.message
    });
  }
});

app.post('/api/cache/clear', cors(corsOptions), async (req, res) => {
  try {
    const { type } = req.body;
    let result;
    
    switch (type) {
      case 'users':
        result = await cacheService.clearUserCaches();
        break;
      case 'api':
        result = await cacheService.clearApiCaches();
        break;
      case 'all':
        await cacheClient.flushAll();
        result = 'all';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: '无效的缓存类型'
        });
    }
    
    res.json({
      success: true,
      message: `缓存清除成功: ${result}`,
      type: type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '清除缓存失败',
      message: error.message
    });
  }
});

// SPA路由支持 - 必须在所有API路由之后
app.get('*', (req, res) => {
  // 如果是API请求，返回404
  if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/monitoring') || req.path.startsWith('/api-docs')) {
    return res.status(404).json({ error: '接口不存在' });
  }
  
  // 其他所有请求返回前端应用
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// 错误处理中间件
app.use(errorMonitoring());
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

// 启动服务器
const startServer = async () => {
  try {
    // 初始化Redis连接
    console.log('🔧 初始化Redis缓存...');
    await initRedis();
    
    // 初始化告警管理器
    console.log('🚨 初始化告警管理器...');
    await alertManager.initialize();
    
    // 启动监控数据收集
    console.log('📊 启动监控数据收集...');
    monitoringService.startCollection(60000); // 1分钟收集一次
    
    // 启动HTTP服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
      console.log(`📊 健康检查: http://0.0.0.0:${PORT}/health`);
      console.log(`🗂️ API文档: http://0.0.0.0:${PORT}/api-docs`);
      console.log(`📊 缓存统计: http://0.0.0.0:${PORT}/api/cache/stats`);
      console.log(`🛡️ 监控面板: http://0.0.0.0:${PORT}/monitoring`);
      console.log(`📈 监控API: http://0.0.0.0:${PORT}/api/monitoring/summary`);
    });
    
    // 设置监控告警定时任务
    setInterval(async () => {
      try {
        const metrics = monitoringService.getMetrics();
        await alertManager.processMetrics(metrics);
      } catch (error) {
        console.error('❌ 监控告警处理失败:', error.message);
      }
    }, 120000); // 每2分钟检查一次告警
    
    console.log('✅ 监控告警系统启动完成');
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('📡 收到SIGTERM信号，准备关闭服务器...');
  
  // 停止监控数据收集
  monitoringService.stopCollection();
  
  // 关闭Redis连接
  const { closeRedis } = require('./config/redis');
  await closeRedis();
  
  console.log('✅ 服务器已优雅关闭');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 收到SIGINT信号，准备关闭服务器...');
  
  // 停止监控数据收集
  monitoringService.stopCollection();
  
  // 关闭Redis连接
  const { closeRedis } = require('./config/redis');
  await closeRedis();
  
  console.log('✅ 服务器已优雅关闭');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
