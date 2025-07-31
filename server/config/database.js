const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'learning_platform',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+08:00',
  // 连接池配置
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 初始化数据库表
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        email VARCHAR(100),
        phone VARCHAR(20),
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建文章表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        category VARCHAR(100),
        required_reading_time INT DEFAULT 30,
        file_type ENUM('pdf', 'word', 'none') DEFAULT 'none',
        file_url VARCHAR(500),
        file_name VARCHAR(200),
        storage_type ENUM('local', 'oss', 'hybrid') DEFAULT 'local',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建问题表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        question_text TEXT NOT NULL,
        options JSON NOT NULL,
        correct_answer INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建照片表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        article_id INT NOT NULL,
        photo_data LONGTEXT NOT NULL,
        file_name VARCHAR(200),
        file_size INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建学习记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS learning_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        article_id INT NOT NULL,
        reading_time INT NOT NULL,
        quiz_score INT NOT NULL,
        status ENUM('completed', 'failed') DEFAULT 'completed',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_article (user_id, article_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建系统设置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description VARCHAR(200),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 插入默认管理员用户
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (username, password, name, role) 
      VALUES ('admin', ?, '系统管理员', 'admin')
    `, [hashedPassword]);

    // 插入默认系统设置
    await connection.execute(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
      ('camera_interval', '30', '摄像头拍照间隔（秒）'),
      ('max_file_size', '52428800', '最大文件上传大小（字节）'),
      ('allowed_file_types', 'pdf,doc,docx,jpg,jpeg,png', '允许上传的文件类型')
    `);

    connection.release();
    console.log('✅ 数据库表初始化完成');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initDatabase
}; 