const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');

// 紧急恢复服务器 - 使用内存存储，确保基本登录功能
const app = express();
const PORT = process.env.PORT || 3000;

// 内存存储的用户数据
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
    name: '管理员',
    role: 'admin',
    email: 'admin@example.com',
    phone: '',
    department: '兴隆场车站',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    username: 'maintenance',
    password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
    name: '维护账号',
    role: 'maintenance',
    email: 'maintenance@example.com',
    phone: '',
    department: '兴隆场车站',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    username: 'zhangsan',
    password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
    name: '张三',
    role: 'user',
    email: 'zhangsan@example.com',
    phone: '13812345678',
    department: '白市驿车站',
    created_at: new Date().toISOString()
  }
];

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
  }
}));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mode: 'emergency',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API状态
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '兴隆场车站班前学习监督系统 - 紧急恢复模式',
    version: '1.0.0-emergency',
    storage: 'memory',
    timestamp: new Date().toISOString()
  });
});

// 登录API - 增强错误处理
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 收到登录请求:', req.body);
    
    const { username, password } = req.body;
    
    // 输入验证
    if (!username || !password) {
      console.log('❌ 输入验证失败: 用户名或密码为空');
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    console.log('👤 查找用户:', username);
    
    // 查找用户
    const user = users.find(u => u.username === username);
    if (!user) {
      console.log('❌ 用户不存在:', username);
      return res.status(401).json({ 
        success: false,
        error: '用户名或密码错误' 
      });
    }
    
    console.log('🔍 找到用户, 验证密码...');
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ 密码验证失败');
      return res.status(401).json({ 
        success: false,
        error: '用户名或密码错误' 
      });
    }

    console.log('✅ 登录成功:', username);
    
    // 返回成功响应
    const { password: _, ...userInfo } = user;
    res.json({
      success: true,
      message: '登录成功',
      user: userInfo,
      token: 'emergency-token-' + Date.now()
    });

  } catch (error) {
    console.error('💥 登录处理异常:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误',
      details: error.message,
      mode: 'emergency'
    });
  }
});

// 用户注册（简化版）
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, role = 'user', email, phone, department } = req.body;

    // 基本验证
    if (!username || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: '用户名、密码和姓名不能为空' 
      });
    }

    // 检查用户名是否存在
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ 
        success: false,
        error: '用户名已存在' 
      });
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10);
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

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      userId: newUser.id
    });

    console.log('新用户注册成功:', { username, name, role });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误' 
    });
  }
});

// 获取用户列表（管理员功能）
app.get('/api/users', (req, res) => {
  try {
    const userList = users.map(({ password, ...user }) => user);
    res.json({
      success: true,
      users: userList,
      total: userList.length
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误' 
    });
  }
});

// SPA路由支持
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('发送index.html失败:', err);
      res.status(500).send('页面加载失败');
    }
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('💥 全局错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    mode: 'emergency',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 紧急恢复服务器启动成功！`);
  console.log(`🌐 访问地址: http://0.0.0.0:${PORT}`);
  console.log(`💾 存储模式: 内存存储`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
  console.log(`📋 测试账号: admin / 123456`);
  console.log('================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;



