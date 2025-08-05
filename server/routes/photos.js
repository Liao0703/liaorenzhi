const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// 获取所有照片
router.get('/', async (req, res) => {
  try {
    const [photos] = await pool.execute(`
      SELECT p.*, u.name as user_name, a.title as article_title 
      FROM photos p 
      LEFT JOIN users u ON p.user_id = u.id 
      LEFT JOIN articles a ON p.article_id = a.id 
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('获取照片列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单个照片
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [photos] = await pool.execute(`
      SELECT p.*, u.name as user_name, a.title as article_title 
      FROM photos p 
      LEFT JOIN users u ON p.user_id = u.id 
      LEFT JOIN articles a ON p.article_id = a.id 
      WHERE p.id = ?
    `, [id]);
    
    if (photos.length === 0) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    res.json({
      success: true,
      data: photos[0]
    });
  } catch (error) {
    console.error('获取照片信息失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 上传照片
router.post('/', [
  body('user_id').isInt({ min: 1 }).withMessage('用户ID无效'),
  body('article_id').isInt({ min: 1 }).withMessage('文章ID无效'),
  body('photo_data').notEmpty().withMessage('照片数据不能为空'),
  body('file_name').optional(),
  body('file_size').optional().isInt({ min: 1 }).withMessage('文件大小无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { user_id, article_id, photo_data, file_name, file_size } = req.body;
    
    // 验证用户和文章是否存在
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(400).json({ error: '用户不存在' });
    }
    
    const [articles] = await pool.execute('SELECT id FROM articles WHERE id = ?', [article_id]);
    if (articles.length === 0) {
      return res.status(400).json({ error: '文章不存在' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO photos (user_id, article_id, photo_data, file_name, file_size) VALUES (?, ?, ?, ?, ?)',
      [user_id, article_id, photo_data, file_name, file_size]
    );
    
    res.status(201).json({
      success: true,
      message: '照片上传成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('上传照片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除照片
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM photos WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    res.json({
      success: true,
      message: '照片删除成功'
    });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户照片
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [photos] = await pool.execute(`
      SELECT p.*, a.title as article_title 
      FROM photos p 
      LEFT JOIN articles a ON p.article_id = a.id 
      WHERE p.user_id = ? 
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('获取用户照片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取文章照片
router.get('/article/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const [photos] = await pool.execute(`
      SELECT p.*, u.name as user_name 
      FROM photos p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.article_id = ? 
      ORDER BY p.created_at DESC
    `, [articleId]);
    
    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('获取文章照片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 