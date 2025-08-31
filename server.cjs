const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'env.cloud' });

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建数据库连接池
let pool;

// 初始化数据库连接
const initDatabase = async () => {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // 测试连接
    const connection = await pool.getConnection();
    console.log('✅ 云数据库连接成功');
    console.log('🗄️ 数据库:', process.env.DB_NAME);
    console.log('🌐 主机:', process.env.DB_HOST);
    connection.release();
    
    // 检查用户表是否存在，如果不存在则使用内存存储
    try {
      await pool.execute('SELECT COUNT(*) FROM users');
      console.log('✅ 用户表存在，使用数据库存储');
      return true;
    } catch (error) {
      console.log('⚠️  用户表不存在，请执行 create-users-table.sql');
      console.log('📋 临时使用内存存储模式');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('🔄 启用内存存储模式');
    return false;
  }
};

// 内存存储（作为数据库连接失败时的备用方案）
let users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
    name: '管理员',
    role: 'admin',
    email: 'admin@example.com',
    phone: '',
    department: '',
    created_at: new Date().toISOString()
  }
];

// 数据库操作函数
const dbOperations = {
  // 查找用户
  findUserByUsername: async (username) => {
    if (pool) {
      try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0] || null;
      } catch (error) {
        console.error('数据库查询失败:', error);
        return users.find(u => u.username === username) || null;
      }
    }
    return users.find(u => u.username === username) || null;
  },
  
  // 创建用户
  createUser: async (userData) => {
    const { username, password, name, role = 'user', email, phone, department } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (pool) {
      try {
        const [result] = await pool.execute(
          'INSERT INTO users (username, password, name, role, email, phone, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [username, hashedPassword, name, role, email, phone, department]
        );
        return { id: result.insertId, ...userData, password: hashedPassword };
      } catch (error) {
        console.error('数据库插入失败:', error);
        // 降级到内存存储
      }
    }
    
    // 内存存储
    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword,
      name,
      role,
      email: email || '',
      phone: phone || '',
      department: department || '',
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    return newUser;
  },
  
  // 验证密码
  verifyPassword: async (password, hashedPassword) => {
    // 若数据库中的密码散列不存在或格式无效，则直接返回 false，防止抛出异常导致 500 错误
    if (!hashedPassword) {
      return false;
    }
    // 若散列为 Buffer，转换为字符串
    const hashString = Buffer.isBuffer(hashedPassword) ? hashedPassword.toString() : hashedPassword;
    try {
      return await bcrypt.compare(password, hashString);
    } catch (err) {
      console.error('密码验证失败:', err);
      return false;
    }
  }
};

// 输入验证函数
const validateInput = (data) => {
  const errors = [];
  
  if (!data.username || data.username.length < 3) {
    errors.push('用户名至少3个字符');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('密码至少6个字符');
  }
  
  if (!data.name || data.name.trim() === '') {
    errors.push('姓名不能为空');
  }
  
  if (data.role && !['admin', 'user', 'maintenance'].includes(data.role)) {
    errors.push('角色无效');
  }
  
  return errors;
};

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filepath) => {
    // 为JavaScript模块文件设置Safari兼容的MIME类型
    if (filepath.endsWith('.js')) {
      // Safari要求ES模块使用application/javascript或text/javascript
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      // 添加X-Content-Type-Options防止MIME类型嗅探
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    // 为CSS文件设置MIME类型
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
    // 为JSON文件设置MIME类型
    if (filepath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    }
    // 为HTML文件设置MIME类型
    if (filepath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    }
    // 为图片文件设置MIME类型
    if (filepath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    if (filepath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    if (filepath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    }
  }
}));

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

// favicon.ico 处理
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // 返回空内容，避免404错误
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

// 云数据库认证API - 支持数据库和内存双重存储
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    // 从数据库或内存中查找用户
    const user = await dbOperations.findUserByUsername(username);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: '用户名或密码错误' 
      });
    }
    
    // 验证密码
    const isValidPassword = await dbOperations.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: '用户名或密码错误' 
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;

    res.json({
      success: true,
      message: '登录成功',
      user: userInfo,
      token: 'token-' + Date.now()
    });

    console.log('用户登录成功:', username, pool ? '(数据库)' : '(内存)');

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误' 
    });
  }
});

// 用户注册API - 使用云数据库存储
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, role = 'user', email, phone, department } = req.body;

    // 验证输入
    const errors = validateInput({ username, password, name, role });
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors 
      });
    }

    // 检查用户名是否已存在
    const existingUser = await dbOperations.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    // 创建新用户（自动选择数据库或内存存储）
    const newUser = await dbOperations.createUser({
      username, password, name, role, email, phone, department
    });

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      userId: newUser.id,
      storageMode: pool ? 'database' : 'memory'
    });

    console.log('新用户注册成功:', { 
      username, name, role, userId: newUser.id,
      storage: pool ? '云数据库' : '内存存储'
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message
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

// 启动服务器（异步启动以初始化数据库）
const startServer = async () => {
  // 初始化数据库连接
  const dbConnected = await initDatabase();
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 兴隆场车站班前学习监督系统启动成功！`);
    console.log(`📁 项目目录: ${__dirname}`);
    console.log(`🌐 本地访问: http://localhost:${PORT}`);
    console.log(`🌍 外部访问: http://0.0.0.0:${PORT}`);
    console.log(`🔧 健康检查: http://localhost:${PORT}/health`);
    console.log(`📊 API状态: http://localhost:${PORT}/api/status`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log(`💾 存储模式: ${dbConnected ? '云数据库 + 内存备用' : '内存存储'}`);
    console.log(`📝 注册功能: 已升级到云数据库存储`);
    console.log('================================');
  });
  
  return server;
};

// 启动应用
let serverInstance;
startServer().then(server => {
  serverInstance = server;
}).catch(error => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('服务器已关闭');
      if (pool) pool.end();
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('服务器已关闭');
      if (pool) pool.end();
      process.exit(0);
    });
  }
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