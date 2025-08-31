/**
 * 云数据库用户同步脚本
 * 用于连接阿里云RDS数据库，实现用户管理功能的完整同步
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './env.cloud' });

// 云数据库配置
const cloudDBConfig = {
  host: process.env.DB_HOST || 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'admin123',
  password: process.env.DB_PASSWORD || 'Liao0820',
  database: process.env.DB_NAME || 'learning_platform',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-learning-platform-2025';

// 创建云数据库连接池
let cloudPool;

async function initCloudDB() {
  try {
    cloudPool = mysql.createPool({
      ...cloudDBConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // 测试连接
    const connection = await cloudPool.getConnection();
    console.log('✅ 成功连接到云数据库');
    
    // 检查users表是否存在
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length === 0) {
      console.log('⚠️ users表不存在，正在创建...');
      await createUsersTable(connection);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 云数据库连接失败:', error.message);
    return false;
  }
}

// 创建users表
async function createUsersTable(connection) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      full_name VARCHAR(100),
      role ENUM('admin', 'maintenance', 'user') DEFAULT 'user',
      employee_id VARCHAR(20),
      company VARCHAR(100) DEFAULT '兴隆村车站',
      department VARCHAR(100) DEFAULT '白市驿车站',
      team VARCHAR(50),
      job_type VARCHAR(50),
      email VARCHAR(100),
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_role (role),
      INDEX idx_employee_id (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await connection.execute(createTableSQL);
  console.log('✅ users表创建成功');
  
  // 插入默认管理员账号
  await insertDefaultUsers(connection);
}

// 插入默认用户
async function insertDefaultUsers(connection) {
  const defaultUsers = [
    {
      username: 'admin',
      password: '123456',
      name: '系统管理员',
      role: 'admin',
      employee_id: 'ADMIN001'
    },
    {
      username: 'maintenance',
      password: '123456',
      name: '维护管理员',
      role: 'maintenance',
      employee_id: 'MAINT001'
    },
    {
      username: 'qiudalin',
      password: '123456',
      name: '邱大林',
      role: 'user',
      employee_id: '10001'
    },
    {
      username: 'liaorenzhi',
      password: '123456',
      name: '廖仁志',
      role: 'user',
      employee_id: '10002'
    }
  ];
  
  for (const user of defaultUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        `INSERT INTO users (username, password, name, role, employee_id, company, department) 
         VALUES (?, ?, ?, ?, ?, '兴隆村车站', '白市驿车站')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [user.username, hashedPassword, user.name, user.role, user.employee_id]
      );
      console.log(`✅ 用户 ${user.username} 已创建/更新`);
    } catch (error) {
      console.log(`⚠️ 用户 ${user.username} 创建失败:`, error.message);
    }
  }
}

// 用户管理API函数
class UserManagementAPI {
  // 获取所有用户
  static async getAllUsers() {
    try {
      const [users] = await cloudPool.execute(
        `SELECT id, username, name, full_name, role, employee_id, 
         company, department, team, job_type, email, phone, created_at 
         FROM users ORDER BY created_at DESC`
      );
      return { success: true, data: users };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 创建用户
  static async createUser(userData) {
    try {
      const { username, password, name, full_name, role = 'user', 
              employee_id, company = '兴隆村车站', department = '白市驿车站', 
              team, job_type, email, phone } = userData;
      
      // 检查用户名是否已存在
      const [existing] = await cloudPool.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      
      if (existing.length > 0) {
        return { success: false, error: '用户名已存在' };
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 创建用户
      const [result] = await cloudPool.execute(
        `INSERT INTO users (username, password, name, full_name, role, 
         employee_id, company, department, team, job_type, email, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, name, full_name, role, 
         employee_id, company, department, team, job_type, email, phone]
      );
      
      return { 
        success: true, 
        message: '用户创建成功', 
        userId: result.insertId 
      };
    } catch (error) {
      console.error('创建用户失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 更新用户
  static async updateUser(userId, userData) {
    try {
      const { name, full_name, password, employee_id, company, 
              department, team, job_type, email, phone, role } = userData;
      
      // 检查用户是否存在
      const [existing] = await cloudPool.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (existing.length === 0) {
        return { success: false, error: '用户不存在' };
      }
      
      // 构建更新查询
      let updateFields = [];
      let updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (full_name !== undefined) {
        updateFields.push('full_name = ?');
        updateValues.push(full_name);
      }
      if (employee_id !== undefined) {
        updateFields.push('employee_id = ?');
        updateValues.push(employee_id);
      }
      if (company !== undefined) {
        updateFields.push('company = ?');
        updateValues.push(company);
      }
      if (department !== undefined) {
        updateFields.push('department = ?');
        updateValues.push(department);
      }
      if (team !== undefined) {
        updateFields.push('team = ?');
        updateValues.push(team);
      }
      if (job_type !== undefined) {
        updateFields.push('job_type = ?');
        updateValues.push(job_type);
      }
      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }
      if (role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }
      
      // 如果提供了新密码，更新密码
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }
      
      if (updateFields.length === 0) {
        return { success: false, error: '没有要更新的字段' };
      }
      
      updateValues.push(userId);
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      await cloudPool.execute(query, updateValues);
      
      return { success: true, message: '用户信息更新成功' };
    } catch (error) {
      console.error('更新用户失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 删除用户
  static async deleteUser(userId) {
    try {
      // 检查用户是否存在
      const [existing] = await cloudPool.execute(
        'SELECT id, username FROM users WHERE id = ?',
        [userId]
      );
      
      if (existing.length === 0) {
        return { success: false, error: '用户不存在' };
      }
      
      // 防止删除admin账号
      if (existing[0].username === 'admin') {
        return { success: false, error: '不能删除管理员账号' };
      }
      
      await cloudPool.execute('DELETE FROM users WHERE id = ?', [userId]);
      
      return { success: true, message: '用户删除成功' };
    } catch (error) {
      console.error('删除用户失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 验证用户登录
  static async authenticateUser(username, password) {
    try {
      const [users] = await cloudPool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) {
        return { success: false, error: '用户名或密码错误' };
      }
      
      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return { success: false, error: '用户名或密码错误' };
      }
      
      // 生成JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // 返回用户信息（不包含密码）
      const { password: _, ...userInfo } = user;
      
      return {
        success: true,
        token,
        user: userInfo
      };
    } catch (error) {
      console.error('用户认证失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 验证Token
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { success: true, decoded };
    } catch (error) {
      return { success: false, error: '无效的认证令牌' };
    }
  }
}

// 导出模块
module.exports = {
  initCloudDB,
  UserManagementAPI,
  cloudPool
};

// 如果直接运行此文件，执行初始化
if (require.main === module) {
  (async () => {
    console.log('🚀 开始初始化云数据库用户管理系统...');
    const success = await initCloudDB();
    if (success) {
      console.log('✅ 云数据库初始化完成');
      
      // 测试获取用户列表
      const users = await UserManagementAPI.getAllUsers();
      console.log('\n📋 当前用户列表:');
      if (users.success) {
        users.data.forEach(user => {
          console.log(`  - ${user.username} (${user.name}) - ${user.role}`);
        });
      }
    } else {
      console.log('❌ 云数据库初始化失败');
    }
    
    // 关闭连接池
    if (cloudPool) {
      await cloudPool.end();
    }
  })();
}
