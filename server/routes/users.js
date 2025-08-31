const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { pool } = require('../config/database');
const { cacheService } = require('../services/cacheService');
const { userCache, cacheInvalidation } = require('../middleware/cache');


// JWT认证中间件（支持管理员和维护人员权限）
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ 认证失败: 未提供令牌');
    return res.status(401).json({ 
      success: false,
      error: '未提供认证令牌',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.log('❌ 认证失败: 令牌无效', err.message);
      return res.status(401).json({ 
        success: false,
        error: '认证令牌无效或已过期',
        code: 'INVALID_TOKEN'
      });
    }
    
    console.log('✅ 认证成功:', { 
      userId: user.userId, 
      username: user.username, 
      role: user.role 
    });
    
    req.user = user;
    next();
  });
};

// 权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: '未认证',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ 权限不足:', { 
        userRole: req.user.role, 
        requiredRoles: roles 
      });
      return res.status(403).json({ 
        success: false,
        error: '权限不足',
        code: 'INSUFFICIENT_PERMISSION'
      });
    }
    
    next();
  };
};

// 管理员权限中间件
const requireAdmin = requireRole(['admin']);

// 管理员或维护人员权限中间件
const requireAdminOrMaintenance = requireRole(['admin', 'maintenance']);


// 获取当前登录用户信息（所有已登录用户可访问）
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      'SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('获取当前用户失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 更新当前登录用户信息（所有已登录用户可访问）
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      nickname, name, full_name, employee_id, company, department, team, job_type, email, phone
    } = req.body;

    // 仅允许更新这些字段
    const updates = [];
    const values = [];

    const safePush = (fieldName, value, column) => {
      if (value !== undefined && value !== null) {
        updates.push(`${column} = ?`);
        values.push(value);
      }
    };

    // nickname 映射到 name
    safePush('name', nickname ?? name, 'name');
    safePush('full_name', full_name, 'full_name');
    safePush('employee_id', employee_id, 'employee_id');
    safePush('company', company, 'company');
    safePush('department', department, 'department');
    safePush('team', team, 'team');
    safePush('job_type', job_type, 'job_type');
    safePush('email', email, 'email');
    safePush('phone', phone, 'phone');

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: '没有要更新的字段' });
    }

    values.push(userId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(sql, values);

    res.json({ success: true, message: '资料已更新' });
  } catch (error) {
    console.error('更新当前用户失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 修改当前登录用户密码
router.post('/me/change-password', authenticateToken, [
  body('oldPassword').isLength({ min: 1 }).withMessage('原密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: '输入验证失败', details: errors.array() });
    }

    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    // 读取当前用户
    const [rows] = await pool.execute('SELECT id, password FROM users WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: '原密码不正确' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    res.json({ success: true, message: '密码已修改' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});


/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [用户管理]
 *     summary: 获取所有用户列表
 *     description: 获取系统中所有用户的信息（管理员和维护人员可访问）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */

// 获取所有用户 (管理员和维护人员可访问)
router.get('/', authenticateToken, requireAdminOrMaintenance, userCache(600), async (req, res) => {
  try {
    console.log('📋 获取用户列表请求:', { 
      user: req.user.username, 
      role: req.user.role 
    });
    
    const [users] = await pool.execute(
      'SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone, created_at FROM users ORDER BY created_at DESC'
    );

    console.log('✅ 获取用户列表成功，共', users.length, '个用户');

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ 获取用户列表失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// 根据ID获取单个用户 (管理员和维护人员可访问)
router.get('/:id', authenticateToken, requireAdminOrMaintenance, userCache(600), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👤 获取用户信息:', id);

    const [users] = await pool.execute(
      'SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误' 
    });
  }
});

// 创建用户 (管理员和维护人员可访问)
router.post('/', authenticateToken, requireAdminOrMaintenance, cacheInvalidation(['user:*', 'users:*']), [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('name').notEmpty().withMessage('姓名不能为空')
], async (req, res) => {
  try {
    console.log('➕ 创建用户请求:', { 
      by: req.user.username,
      newUsername: req.body.username 
    });
    
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { 
      username, password, name, full_name, role = 'user', 
      employee_id, company = '兴隆村车站', department = '白市驿车站', 
      team, job_type, email, phone 
    } = req.body;

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: '用户名已存在' 
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, name, full_name, role, employee_id, company, department, team, job_type, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name, full_name, role, employee_id, company, department, team, job_type, email, phone]
    );

    console.log('✅ 用户创建成功:', username);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      userId: result.insertId
    });

  } catch (error) {
    console.error('❌ 创建用户失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// 更新用户 (管理员和维护人员可访问)
router.put('/:id', authenticateToken, requireAdminOrMaintenance, cacheInvalidation([
  (req) => `user:${req.params.id}`,
  'users:*'
]), [
  body('name').optional().notEmpty().withMessage('姓名不能为空')
], async (req, res) => {
  try {
    console.log('✏️ 更新用户请求:', { 
      by: req.user.username,
      userId: req.params.id 
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { 
      name, full_name, password, role,
      employee_id, company, department, team, job_type, email, phone 
    } = req.body;

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '用户不存在' 
      });
    }

    // 防止非管理员修改角色
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: '只有管理员可以修改用户角色' 
      });
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
    if (role !== undefined && req.user.role === 'admin') {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    // 如果提供了新密码，则更新密码
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有要更新的字段'
      });
    }

    updateValues.push(id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, updateValues);

    console.log('✅ 用户更新成功:', existingUsers[0].username);

    res.json({
      success: true,
      message: '用户信息更新成功'
    });

  } catch (error) {
    console.error('❌ 更新用户失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// 删除用户 (仅管理员可访问)
router.delete('/:id', authenticateToken, requireAdmin, cacheInvalidation([
  (req) => `user:${req.params.id}`,
  'users:*'
]), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ 删除用户请求:', { 
      by: req.user.username,
      userId: id 
    });

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '用户不存在' 
      });
    }

    // 防止删除admin账号
    if (existingUsers[0].username === 'admin') {
      return res.status(403).json({ 
        success: false,
        error: '不能删除管理员账号' 
      });
    }

    // 删除用户
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    console.log('✅ 用户删除成功:', existingUsers[0].username);

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('❌ 删除用户失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

module.exports = router;
