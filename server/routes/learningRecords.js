const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// 获取所有学习记录
router.get('/', async (req, res) => {
  try {
    const [records] = await pool.execute(`
      SELECT lr.*, u.name as user_name, a.title as article_title 
      FROM learning_records lr 
      LEFT JOIN users u ON lr.user_id = u.id 
      LEFT JOIN articles a ON lr.article_id = a.id 
      ORDER BY lr.completed_at DESC
    `);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('获取学习记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单个学习记录
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [records] = await pool.execute(`
      SELECT lr.*, u.name as user_name, a.title as article_title 
      FROM learning_records lr 
      LEFT JOIN users u ON lr.user_id = u.id 
      LEFT JOIN articles a ON lr.article_id = a.id 
      WHERE lr.id = ?
    `, [id]);
    
    if (records.length === 0) {
      return res.status(404).json({ error: '学习记录不存在' });
    }
    
    res.json({
      success: true,
      data: records[0]
    });
  } catch (error) {
    console.error('获取学习记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建学习记录
router.post('/', [
  body('user_id').isInt({ min: 1 }).withMessage('用户ID无效'),
  body('article_id').isInt({ min: 1 }).withMessage('文章ID无效'),
  body('reading_time').isInt({ min: 1 }).withMessage('阅读时间无效'),
  body('quiz_score').isInt({ min: 0, max: 100 }).withMessage('答题成绩无效'),
  body('status').optional().isIn(['completed', 'failed']).withMessage('状态无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { user_id, article_id, reading_time, quiz_score, status = 'completed' } = req.body;
    
    // 验证用户和文章是否存在
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(400).json({ error: '用户不存在' });
    }
    
    const [articles] = await pool.execute('SELECT id FROM articles WHERE id = ?', [article_id]);
    if (articles.length === 0) {
      return res.status(400).json({ error: '文章不存在' });
    }
    
    // 检查是否已存在相同记录
    const [existing] = await pool.execute(
      'SELECT id FROM learning_records WHERE user_id = ? AND article_id = ?',
      [user_id, article_id]
    );
    
    let result;
    if (existing.length > 0) {
      // 更新现有记录
      [result] = await pool.execute(
        'UPDATE learning_records SET reading_time = ?, quiz_score = ?, status = ?, completed_at = NOW() WHERE user_id = ? AND article_id = ?',
        [reading_time, quiz_score, status, user_id, article_id]
      );
    } else {
      // 创建新记录
      [result] = await pool.execute(
        'INSERT INTO learning_records (user_id, article_id, reading_time, quiz_score, status) VALUES (?, ?, ?, ?, ?)',
        [user_id, article_id, reading_time, quiz_score, status]
      );
    }
    
    res.status(201).json({
      success: true,
      message: '学习记录保存成功',
      data: { id: result.insertId || existing[0].id }
    });
  } catch (error) {
    console.error('保存学习记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户学习记录
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [records] = await pool.execute(`
      SELECT lr.*, a.title as article_title 
      FROM learning_records lr 
      LEFT JOIN articles a ON lr.article_id = a.id 
      WHERE lr.user_id = ? 
      ORDER BY lr.completed_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('获取用户学习记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取文章学习记录
router.get('/article/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const [records] = await pool.execute(`
      SELECT lr.*, u.name as user_name 
      FROM learning_records lr 
      LEFT JOIN users u ON lr.user_id = u.id 
      WHERE lr.article_id = ? 
      ORDER BY lr.completed_at DESC
    `, [articleId]);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('获取文章学习记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取学习统计
router.get('/statistics/overview', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT article_id) as total_articles,
        AVG(reading_time) as avg_reading_time,
        AVG(quiz_score) as avg_quiz_score,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM learning_records
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('获取学习统计失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除学习记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM learning_records WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '学习记录不存在' });
    }
    
    res.json({
      success: true,
      message: '学习记录删除成功'
    });
  } catch (error) {
    console.error('删除学习记录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 