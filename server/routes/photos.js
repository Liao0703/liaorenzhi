const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// 获取照片（支持分页与搜索）
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const q = (req.query.q || '').toString().trim();
    const start = req.query.start ? new Date(req.query.start) : null;
    const end = req.query.end ? new Date(req.query.end) : null;

    const whereClauses = [];
    const params = [];

    if (q) {
      whereClauses.push('(u.name LIKE ? OR a.title LIKE ? OR p.file_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (start && !isNaN(start.getTime())) {
      whereClauses.push('p.created_at >= ?');
      params.push(start);
    }
    if (end && !isNaN(end.getTime())) {
      whereClauses.push('p.created_at <= ?');
      params.push(end);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM photos p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN articles a ON p.article_id = a.id
       ${whereSql}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT p.*, u.name as user_name, a.title as article_title
       FROM photos p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN articles a ON p.article_id = a.id
       ${whereSql}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: { items: rows, page, limit, total, hasNext: offset + rows.length < total }
    });
  } catch (error) {
    console.error('获取照片列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 导出照片为CSV（支持与列表相同的筛选）
router.get('/export', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const start = req.query.start ? new Date(req.query.start) : null;
    const end = req.query.end ? new Date(req.query.end) : null;

    const whereClauses = [];
    const params = [];

    if (q) {
      whereClauses.push('(u.name LIKE ? OR a.title LIKE ? OR p.file_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (start && !isNaN(start.getTime())) {
      whereClauses.push('p.created_at >= ?');
      params.push(start);
    }
    if (end && !isNaN(end.getTime())) {
      whereClauses.push('p.created_at <= ?');
      params.push(end);
    }
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT p.id, u.name AS user_name, a.title AS article_title, p.created_at, p.file_name, p.file_size
       FROM photos p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN articles a ON p.article_id = a.id
       ${whereSql}
       ORDER BY p.created_at DESC`,
      params
    );

    // 生成CSV
    const header = 'ID,用户,文章,拍摄时间,文件名,大小(字节)';
    const lines = rows.map(r => [
      r.id,
      safeCsv(r.user_name),
      safeCsv(r.article_title),
      formatDate(r.created_at),
      safeCsv(r.file_name),
      r.file_size || ''
    ].join(','));
    const csv = [header, ...lines].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=photos_${Date.now()}.csv`);
    res.send('\ufeff' + csv); // BOM 以支持中文
  } catch (error) {
    console.error('导出照片失败:', error);
    res.status(500).json({ success: false, error: '导出失败' });
  }
});

function safeCsv(val) {
  if (val == null) return '';
  const s = String(val);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function formatDate(d) {
  try { return new Date(d).toLocaleString('zh-CN'); } catch { return ''; }
}

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