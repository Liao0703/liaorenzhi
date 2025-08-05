const mysql = require('mysql2/promise');
require('dotenv').config();

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

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    // 如果数据库不存在，创建一个简单的内存存储
    console.log('🔄 使用内存存储模式');
    
    // 创建用户表的模拟数据
    global.memoryDB = {
      users: [
        {
          id: 1,
          username: 'maintenance',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '维护人员',
          role: 'maintenance',
          email: 'maintenance@example.com',
          phone: '13800138001',
          department: '维护部门',
          team: '维护班',
          job_type: '维护人员',
          employee_id: 'MAINT001',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          username: 'admin',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '系统管理员',
          role: 'admin',
          email: 'admin@example.com',
          phone: '13800138002',
          department: 'IT部门',
          team: 'IT团队',
          job_type: '系统管理员',
          employee_id: 'ADMIN001',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          username: 'user',
          password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
          name: '普通用户',
          role: 'user',
          email: 'user@example.com',
          phone: '13800138003',
          department: '操作部门',
          team: '操作班',
          job_type: '普通用户',
          employee_id: 'USER001',
          created_at: new Date().toISOString()
        }
      ]
    };
  }
};

// 内存数据库查询函数
const memoryQuery = {
  execute: async (query, params = []) => {
    if (!global.memoryDB) {
      throw new Error('内存数据库未初始化');
    }
    
    // 简单的SQL查询解析
    if (query.includes('SELECT * FROM users WHERE username = ?')) {
      const username = params[0];
      const user = global.memoryDB.users.find(u => u.username === username);
      return [user ? [user] : []];
    }
    
    if (query.includes('SELECT id, username, name, role')) {
      return [global.memoryDB.users];
    }
    
    return [[]];
  }
};

// 初始化连接
testConnection();

// 导出连接池或内存查询
module.exports = {
  pool: global.memoryDB ? memoryQuery : pool,
  testConnection
};
