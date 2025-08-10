const { pool } = require('./server/config/database');

async function fixDatabase() {
  try {
    console.log('检查数据库表结构...');
    
    // 查看现有表结构
    const [columns] = await pool.execute('SHOW COLUMNS FROM users');
    console.log('当前users表字段:');
    columns.forEach(col => console.log('- ' + col.Field));
    
    const existingFields = columns.map(col => col.Field);
    
    // 添加缺失字段
    const fieldsToAdd = [
      { name: 'full_name', sql: 'ALTER TABLE users ADD COLUMN full_name VARCHAR(100) DEFAULT NULL' },
      { name: 'employee_id', sql: 'ALTER TABLE users ADD COLUMN employee_id VARCHAR(20) DEFAULT NULL' },
      { name: 'company', sql: 'ALTER TABLE users ADD COLUMN company VARCHAR(100) DEFAULT NULL' },
      { name: 'team', sql: 'ALTER TABLE users ADD COLUMN team VARCHAR(50) DEFAULT NULL' },
      { name: 'job_type', sql: 'ALTER TABLE users ADD COLUMN job_type VARCHAR(50) DEFAULT NULL' }
    ];
    
    for (const field of fieldsToAdd) {
      if (!existingFields.includes(field.name)) {
        console.log('正在添加字段:', field.name);
        await pool.execute(field.sql);
        console.log('✓ 已添加:', field.name);
      } else {
        console.log('✓ 字段已存在:', field.name);
      }
    }
    
    // 更新现有用户数据
    console.log('更新现有用户数据...');
    await pool.execute(`
      UPDATE users SET 
        full_name = COALESCE(full_name, name),
        company = COALESCE(company, '兴隆村车站'),
        department = COALESCE(department, '白市驿车站'),
        team = COALESCE(team, '运转一班'),
        job_type = COALESCE(job_type, '车站值班员'),
        employee_id = COALESCE(employee_id, 
          CASE 
            WHEN username = 'maintenance' THEN 'MAINT001'
            WHEN username = 'admin' THEN 'ADMIN001'
            ELSE CONCAT('1000', id)
          END
        )
      WHERE full_name IS NULL OR company IS NULL OR department IS NULL
    `);
    
    console.log('✅ 数据库更新完成!');
    
    // 显示更新后的数据
    const [users] = await pool.execute('SELECT id, username, name, full_name, employee_id, company, department, team, job_type, phone FROM users LIMIT 5');
    console.log('\n更新后的用户数据:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.username}) - ${user.employee_id} - ${user.phone || '无电话'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

fixDatabase();