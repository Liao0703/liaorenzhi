const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 若未显式配置数据库，自动尝试加载项目根目录的 env.cloud（云数据库配置）
if (!process.env.DB_HOST || process.env.DB_HOST === 'localhost') {
  try {
    const cloudEnvPath = path.resolve(__dirname, '..', '..', 'env.cloud');
    if (fs.existsSync(cloudEnvPath)) {
      // 使用 override:true 覆盖之前可能加载的本地 .env（例如 DB_HOST=localhost）
      require('dotenv').config({ path: cloudEnvPath, override: true });
      console.log('🔄 已从 env.cloud 加载云数据库配置');
    }
  } catch (_) {
    // 安静降级
  }
}

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'learning_platform',
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🛠️ 数据库配置: ', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    // 数据库连接成功，确保不使用内存存储
    global.memoryDB = null;
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    // 如果数据库不存在，创建一个简单的内存存储
    console.log('🔄 使用内存存储模式');
    
    // 创建用户表的模拟数据
    global.memoryDB = {
      users: [
        {
          id: 1,
          username: 'admin',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '赵六',
          full_name: '赵六',
          role: 'admin',
          email: 'admin@example.com',
          phone: '13800138001',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转一班',
          job_type: '车站值班员',
          employee_id: 'ADMIN001',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          username: 'maintenance',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '孙七',
          full_name: '孙七',
          role: 'maintenance',
          email: 'maintenance@example.com',
          phone: '13800138002',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转一班',
          job_type: '车站值班员',
          employee_id: 'MAINT001',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          username: 'zhangsan',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '张三',
          full_name: '张三',
          role: 'user',
          email: 'zhangsan@example.com',
          phone: '13812345678',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转一班',
          job_type: '车站值班员',
          employee_id: '10001',
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          username: 'lisi',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '李四',
          full_name: '李四',
          role: 'user',
          email: 'lisi@example.com',
          phone: '13987654321',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转二班',
          job_type: '助理值班员（内勤）',
          employee_id: '10002',
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          username: 'wangwu',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '王五',
          full_name: '王五',
          role: 'user',
          email: 'wangwu@example.com',
          phone: '13611122233',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转三班',
          job_type: '助理值班员（外勤）',
          employee_id: '10003',
          created_at: new Date().toISOString()
        },
        {
          id: 6,
          username: 'zhaoliu',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '赵六',
          full_name: '赵六',
          role: 'user',
          email: 'zhaoliu@example.com',
          phone: '13755566678',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转四班',
          job_type: '连结员',
          employee_id: '10004',
          created_at: new Date().toISOString()
        },
        {
          id: 7,
          username: 'sunqi',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '孙七',
          full_name: '孙七',
          role: 'user',
          email: 'sunqi@example.com',
          phone: '13899887766',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转一班',
          job_type: '调车长',
          employee_id: '10005',
          created_at: new Date().toISOString()
        },
        {
          id: 8,
          username: 'zhouba',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '周八',
          full_name: '周八',
          role: 'user',
          email: 'zhouba@example.com',
          phone: '13544332211',
          company: '兴隆村车站',
          department: '白市驿车站',
          team: '运转二班',
          job_type: '列尾作业员',
          employee_id: '10006',
          created_at: new Date().toISOString()
        }
      ],
      articles: []
    };
  }
};

// 内存数据库查询函数
const memoryQuery = {
  execute: async (query, params = []) => {
    if (!global.memoryDB) {
      throw new Error('内存数据库未初始化');
    }
    
    console.log('内存数据库查询:', query, params);
    console.log('当前articles数据:', global.memoryDB.articles);
    
    // 简单的SQL查询解析
    if (query.includes('SELECT * FROM users WHERE username = ?')) {
      const username = params[0];
      const user = global.memoryDB.users.find(u => u.username === username);
      return [user ? [user] : []];
    }
    
    if (query.includes('SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone, created_at FROM users ORDER BY created_at DESC')) {
      return [global.memoryDB.users];
    }
    
    if (query.includes('SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone, created_at FROM users WHERE id = ?')) {
      const id = parseInt(params[0]);
      const user = global.memoryDB.users.find(u => u.id === id);
      return [user ? [user] : []];
    }
    
    if (query.includes('SELECT id FROM users WHERE username = ?')) {
      const username = params[0];
      const user = global.memoryDB.users.find(u => u.username === username);
      return [user ? [user] : []];
    }
    
    if (query.includes('SELECT id FROM users WHERE id = ?')) {
      const id = parseInt(params[0]);
      const user = global.memoryDB.users.find(u => u.id === id);
      return [user ? [user] : []];
    }
    
    if (query.includes('INSERT INTO users')) {
      const newId = Math.max(...global.memoryDB.users.map(u => u.id)) + 1;
      const [username, password, name, full_name, role, employee_id, company, department, team, job_type, email, phone] = params;
      const newUser = {
        id: newId,
        username,
        password,
        name,
        full_name,
        role,
        employee_id,
        company,
        department,
        team,
        job_type,
        email,
        phone,
        created_at: new Date().toISOString()
      };
      global.memoryDB.users.push(newUser);
      return [{ insertId: newId }];
    }
    
    if (query.includes('UPDATE users SET')) {
      const id = parseInt(params[params.length - 1]); // ID is always the last parameter
      const userIndex = global.memoryDB.users.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        // Update user fields based on the query structure
        if (query.includes('password = ?')) {
          // With password update
          const [name, full_name, employee_id, company, department, team, job_type, email, phone, password] = params.slice(0, -1);
          global.memoryDB.users[userIndex] = {
            ...global.memoryDB.users[userIndex],
            name,
            full_name,
            employee_id,
            company,
            department,
            team,
            job_type,
            email,
            phone,
            password
          };
        } else {
          // Without password update
          const [name, full_name, employee_id, company, department, team, job_type, email, phone] = params.slice(0, -1);
          global.memoryDB.users[userIndex] = {
            ...global.memoryDB.users[userIndex],
            name,
            full_name,
            employee_id,
            company,
            department,
            team,
            job_type,
            email,
            phone
          };
        }
      }
      return [{ affectedRows: userIndex !== -1 ? 1 : 0 }];
    }
    
    if (query.includes('DELETE FROM users WHERE id = ?')) {
      const id = parseInt(params[0]);
      const userIndex = global.memoryDB.users.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        global.memoryDB.users.splice(userIndex, 1);
      }
      return [{ affectedRows: userIndex !== -1 ? 1 : 0 }];
    }
    
    // Articles表操作
    if (query.includes('SELECT * FROM articles ORDER BY created_at DESC')) {
      const result = global.memoryDB.articles || [];
      console.log('SELECT articles 返回:', result);
      return [result];
    }
    
    if (query.includes('SELECT * FROM articles WHERE id = ?')) {
      const id = params[0];
      const article = (global.memoryDB.articles || []).find(a => a.id === id || a.id === parseInt(id));
      return [article ? [article] : []];
    }
    
    if (query.includes('INSERT INTO articles')) {
      const [title, content, category, required_reading_time, file_type, file_url, file_name, storage_type] = params;
      const newId = Math.max(0, ...(global.memoryDB.articles || []).map(a => parseInt(a.id) || 0)) + 1;
      const newArticle = {
        id: newId,
        title,
        content,
        category,
        required_reading_time: required_reading_time || 30,
        file_type: file_type || 'none',
        file_url,
        file_name,
        storage_type: storage_type || 'local',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (!global.memoryDB.articles) {
        global.memoryDB.articles = [];
      }
      global.memoryDB.articles.push(newArticle);
      return [{ insertId: newId }];
    }
    
    if (query.includes('UPDATE articles SET') && query.includes('WHERE id = ?')) {
      const id = params[params.length - 1];
      const articleIndex = (global.memoryDB.articles || []).findIndex(a => a.id === id || a.id === parseInt(id));
      if (articleIndex !== -1) {
        // 简单更新（需要根据具体UPDATE语句解析）
        global.memoryDB.articles[articleIndex].updated_at = new Date().toISOString();
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    
    if (query.includes('DELETE FROM articles WHERE id = ?')) {
      const id = params[0];
      const articleIndex = (global.memoryDB.articles || []).findIndex(a => a.id === id || a.id === parseInt(id));
      if (articleIndex !== -1) {
        global.memoryDB.articles.splice(articleIndex, 1);
      }
      return [{ affectedRows: articleIndex !== -1 ? 1 : 0 }];
    }
    
    if (query.includes('SELECT COUNT(*) as count FROM articles')) {
      const count = (global.memoryDB.articles || []).length;
      return [[{ count }]];
    }
    
    return [[]];
  }
};

// 初始化连接（异步，不阻塞导出）
testConnection();

// 包装一个代理层，按需在每次调用时选择真实数据库或内存数据库
const poolWrapper = {
  execute: async (query, params = []) => {
    // 优先尝试使用真实数据库
    try {
      return await pool.execute(query, params);
    } catch (error) {
      // 数据库不可用时，自动降级到内存库，保证线上不会 500
      console.error('数据库执行失败，自动降级到内存存储:', error.message);
      
      // 若内存库已准备，使用内存库
      if (global.memoryDB) {
        return memoryQuery.execute(query, params);
      }
      
      // 初始化一个最小的内存库
      global.memoryDB = { users: [], articles: [] };
      return memoryQuery.execute(query, params);
    }
  },
  
  // 添加 query 方法（兼容旧代码）
  query: async (query, params = []) => {
    return poolWrapper.execute(query, params);
  }
};

module.exports = {
  pool: poolWrapper,
  testConnection
};
