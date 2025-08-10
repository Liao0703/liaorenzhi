const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { pool } = require('../config/database');

// 获取所有用户 (仅管理员)
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 根据ID获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建用户
router.post('/', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('name').notEmpty().withMessage('姓名不能为空')
], async (req, res) => {
  try {
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
      employee_id, company, department, team, job_type, email, phone 
    } = req.body;

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
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

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      userId: result.insertId
    });

  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误' 
    });
  }
});

// 更新用户
router.put('/:id', [
  body('name').notEmpty().withMessage('姓名不能为空')
], async (req, res) => {
  try {
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
      name, full_name, password, 
      employee_id, company, department, team, job_type, email, phone 
    } = req.body;

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '用户不存在' 
      });
    }

    // 构建更新查询
    let query = 'UPDATE users SET name = ?, full_name = ?, employee_id = ?, company = ?, department = ?, team = ?, job_type = ?, email = ?, phone = ?';
    let params = [name, full_name, employee_id, company, department, team, job_type, email, phone];

    // 如果提供了新密码，则更新密码
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    res.json({
      success: true,
      message: '用户更新成功'
    });

  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误' 
    });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '用户不存在' 
      });
    }

    // 删除用户
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器内部错误' 
    });
  }
});

module.exports = router;
