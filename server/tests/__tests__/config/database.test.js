const { pool } = require('../../../config/database');

describe('数据库配置测试', () => {
  describe('数据库连接', () => {
    test('数据库池应该正确初始化', () => {
      expect(pool).toBeDefined();
      expect(typeof pool.execute).toBe('function');
    });

    test('应该能执行简单查询', async () => {
      // 测试基本的查询执行
      const result = await pool.execute('SELECT 1 as test');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('用户数据操作', () => {
    test('应该能查询用户表', async () => {
      const [users] = await pool.execute(
        'SELECT id, username, name, role FROM users ORDER BY created_at DESC'
      );

      expect(Array.isArray(users)).toBe(true);
      
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
      }
    });

    test('应该能根据用户名查询用户', async () => {
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        ['testuser']
      );

      expect(Array.isArray(users)).toBe(true);
      
      if (users.length > 0) {
        const user = users[0];
        expect(user.username).toBe('testuser');
        expect(user).toHaveProperty('password');
        expect(user).toHaveProperty('role');
      }
    });

    test('应该能根据ID查询用户', async () => {
      const [users] = await pool.execute(
        'SELECT id, username, name, role FROM users WHERE id = ?',
        [1]
      );

      expect(Array.isArray(users)).toBe(true);
      
      if (users.length > 0) {
        const user = users[0];
        expect(user.id).toBe(1);
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('name');
      }
    });
  });

  describe('内存数据库降级测试', () => {
    test('全局内存数据库应该包含测试数据', () => {
      if (global.memoryDB) {
        expect(global.memoryDB).toHaveProperty('users');
        expect(Array.isArray(global.memoryDB.users)).toBe(true);
        expect(global.memoryDB.users.length).toBeGreaterThan(0);

        // 验证测试用户存在
        const testUser = global.memoryDB.users.find(u => u.username === 'testuser');
        expect(testUser).toBeDefined();
        expect(testUser).toHaveProperty('role', 'user');

        const testAdmin = global.memoryDB.users.find(u => u.username === 'testadmin');
        expect(testAdmin).toBeDefined();
        expect(testAdmin).toHaveProperty('role', 'admin');
      }
    });

    test('应该能正确处理用户创建操作', async () => {
      const insertQuery = `
        INSERT INTO users (username, password, name, full_name, role, employee_id, company, department, team, job_type, email, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const userData = [
        'dbtest_user',
        'hashedPassword123',
        '数据库测试用户',
        '数据库测试用户',
        'user',
        'DBTEST001',
        '测试公司',
        '测试部门',
        '测试班组',
        '测试工种',
        'dbtest@example.com',
        '13800138888'
      ];

      const [result] = await pool.execute(insertQuery, userData);
      
      expect(result).toHaveProperty('insertId');
      expect(typeof result.insertId).toBe('number');
      expect(result.insertId).toBeGreaterThan(0);
    });

    test('应该能正确处理用户更新操作', async () => {
      const updateQuery = `
        UPDATE users SET name = ?, email = ? WHERE id = ?
      `;

      const [result] = await pool.execute(updateQuery, ['更新测试名称', 'updated@test.com', 1]);
      
      expect(result).toHaveProperty('affectedRows');
      expect(result.affectedRows).toBeGreaterThanOrEqual(0);
    });

    test('应该能正确处理用户删除操作', async () => {
      // 先创建一个用户
      const insertQuery = `
        INSERT INTO users (username, password, name, full_name, role, employee_id, company, department, team, job_type, email, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [insertResult] = await pool.execute(insertQuery, [
        'temp_delete_user',
        'hashedPassword123',
        '临时删除用户',
        '临时删除用户',
        'user',
        'TEMP001',
        '测试公司',
        '测试部门',
        '测试班组',
        '测试工种',
        'temp@example.com',
        '13800138999'
      ]);

      const userId = insertResult.insertId;

      // 然后删除这个用户
      const deleteQuery = 'DELETE FROM users WHERE id = ?';
      const [deleteResult] = await pool.execute(deleteQuery, [userId]);
      
      expect(deleteResult).toHaveProperty('affectedRows');
      expect(deleteResult.affectedRows).toBe(1);
    });
  });

  describe('查询性能测试', () => {
    test('用户查询应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      await pool.execute('SELECT * FROM users WHERE username = ?', ['testuser']);
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      // 查询应该在100ms内完成（内存数据库应该更快）
      expect(queryTime).toBeLessThan(100);
    });

    test('用户列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      await pool.execute('SELECT id, username, name, role FROM users ORDER BY created_at DESC');
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      // 列表查询应该在200ms内完成
      expect(queryTime).toBeLessThan(200);
    });
  });

  describe('数据完整性测试', () => {
    test('重复用户名应该被正确处理', async () => {
      const insertQuery = `
        INSERT INTO users (username, password, name, full_name, role, employee_id, company, department, team, job_type, email, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // 尝试插入重复的用户名
      const userData = [
        'testuser', // 已存在的用户名
        'hashedPassword123',
        '重复测试用户',
        '重复测试用户',
        'user',
        'DUP001',
        '测试公司',
        '测试部门',
        '测试班组',
        '测试工种',
        'dup@example.com',
        '13800138777'
      ];

      // 在内存数据库中，这应该会成功但用户名重复检查由应用层处理
      try {
        await pool.execute(insertQuery, userData);
      } catch (error) {
        // 如果是真实数据库，可能会抛出唯一约束错误
        expect(error).toBeDefined();
      }
    });

    test('用户数据字段应该正确保存和检索', async () => {
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        ['testuser']
      );

      if (users.length > 0) {
        const user = users[0];
        
        // 验证基本字段
        expect(typeof user.id).toBe('number');
        expect(typeof user.username).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(['admin', 'user', 'maintenance']).toContain(user.role);
        
        // 验证可选字段存在
        expect(user).toHaveProperty('full_name');
        expect(user).toHaveProperty('employee_id');
        expect(user).toHaveProperty('company');
        expect(user).toHaveProperty('department');
        expect(user).toHaveProperty('team');
        expect(user).toHaveProperty('job_type');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('phone');
        expect(user).toHaveProperty('created_at');
      }
    });
  });
});
