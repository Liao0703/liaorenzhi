const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 获取所有用户 (仅管理员)
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, name, role, email, phone, department, created_at FROM users ORDER BY created_at DESC'
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
      'SELECT id, username, name, role, email, phone, department, created_at FROM users WHERE id = ?',
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

module.exports = router;
