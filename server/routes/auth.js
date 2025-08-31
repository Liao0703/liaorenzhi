const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { cacheService } = require('../services/cacheService');
const { cacheInvalidation } = require('../middleware/cache');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [认证管理]
 *     summary: 用户登录
 *     description: 使用用户名和密码进行登录认证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: 用户名或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 用户名或密码错误
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// 用户登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { username, password } = req.body;

    console.log('登录尝试:', { username, password: password ? '***' : 'undefined' });

    // 查询用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    console.log('查询结果:', users.length, '个用户');

    if (users.length === 0) {
      console.log('用户不存在:', username);
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];
    console.log('找到用户:', { id: user.id, username: user.username, role: user.role });
    console.log('存储的密码哈希:', user.password);

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('密码验证结果:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('密码验证失败');
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;

    // 缓存用户信息
    await cacheService.setUserCache(user.id, userInfo, 3600); // 缓存1小时
    await cacheService.setUserSession(user.id, { token, loginTime: new Date() }, 3600);

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: userInfo
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [认证管理]
 *     summary: 用户注册
 *     description: 注册新用户账号
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, name, role]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: 用户名，至少3个字符
 *                 example: zhangsan
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: 密码，至少6个字符
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 description: 姓名
 *                 example: 张三
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 description: 用户角色
 *                 example: user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *                 example: zhangsan@example.com
 *               phone:
 *                 type: string
 *                 description: 电话号码
 *                 example: "13812345678"
 *               department:
 *                 type: string
 *                 description: 部门
 *                 example: 白市驿车站
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 用户注册成功
 *                 userId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: 用户名已存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 用户名已存在
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// 用户注册 (注册后清除用户列表缓存)
router.post('/register', cacheInvalidation(['users:*']), [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('role').isIn(['admin', 'user']).withMessage('角色无效')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { username, password, name, role = 'user', email, phone, department } = req.body;

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（将undefined转换为null以避免MySQL错误）
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, name, role, email, phone, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name, role, email || null, phone || null, department || null]
    );

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      userId: result.insertId
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 验证令牌中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '访问令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, name, role, email, phone, department, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 修改密码
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // 获取当前用户信息
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.userId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 