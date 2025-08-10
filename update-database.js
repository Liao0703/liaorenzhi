const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function updateDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'learning_platform',
    multipleStatements: true
  };

  try {
    console.log('正在连接数据库...');
    const connection = await mysql.createConnection(config);
    
    console.log('读取SQL脚本...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'update-users-table.sql'), 'utf8');
    
    console.log('执行数据库更新...');
    const [results] = await connection.query(sqlScript);
    
    console.log('✅ 数据库更新成功！');
    console.log('更新结果:', results);
    
    await connection.end();
  } catch (error) {
    console.error('❌ 数据库更新失败:', error);
    
    if (error.code === 'ER_BAD_DB_ERROR' || error.code === 'ECONNREFUSED') {
      console.log('🔄 数据库连接失败，可能需要启动MySQL服务或创建数据库');
      console.log('📝 建议操作：');
      console.log('1. 确保MySQL服务正在运行');
      console.log('2. 创建数据库：CREATE DATABASE learning_platform;');
      console.log('3. 配置正确的数据库连接信息');
    }
  }
}

updateDatabase();