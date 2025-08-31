const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// 获取所有文章（支持按工种过滤）
router.get('/', async (req, res) => {
  try {
    const { user_job_type } = req.query;
    
    let query = 'SELECT * FROM articles';
    let params = [];
    
    // 如果提供了工种参数，则过滤只显示该工种可以访问的文章
    if (user_job_type) {
      query += ' WHERE (allowed_job_types IS NULL OR JSON_CONTAINS(allowed_job_types, ?))';
      params.push(JSON.stringify(user_job_type));
    }
    
    // 为兼容不同库结构，改为按自增ID排序，避免因缺少 created_at 列导致查询失败
    query += ' ORDER BY id DESC';
    
    const [articles] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单个文章
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [articles] = await pool.execute(
      'SELECT * FROM articles WHERE id = ?',
      [id]
    );
    
    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    res.json({
      success: true,
      data: articles[0]
    });
  } catch (error) {
    console.error('获取文章信息失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建文章
router.post('/', [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('content').optional(),
  body('category').optional(),
  body('required_reading_time').optional().isInt({ min: 1 }).withMessage('阅读时间必须大于0'),
  body('file_type').optional().isIn(['pdf', 'word', 'none']).withMessage('文件类型无效'),
  body('file_url').optional(),
  body('file_name').optional(),
  body('storage_type').optional().isIn(['local', 'oss', 'hybrid']).withMessage('存储类型无效'),
  body('allowed_job_types').optional().isArray().withMessage('工种分配必须是数组格式')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { 
      title, content, category, required_reading_time = 30,
      file_type = 'none', file_url, file_name, storage_type = 'local',
      allowed_job_types = null
    } = req.body;
    
    // 处理工种分配数据
    let jobTypesData = null;
    if (allowed_job_types && Array.isArray(allowed_job_types) && allowed_job_types.length > 0) {
      jobTypesData = JSON.stringify(allowed_job_types);
    }
    
    const [result] = await pool.execute(
      'INSERT INTO articles (title, content, category, required_reading_time, file_type, file_url, file_name, storage_type, allowed_job_types) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, category, required_reading_time, file_type, file_url, file_name, storage_type, jobTypesData]
    );
    
    res.status(201).json({
      success: true,
      message: '文章创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新文章
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('标题不能为空'),
  body('content').optional(),
  body('category').optional(),
  body('required_reading_time').optional().isInt({ min: 1 }).withMessage('阅读时间必须大于0'),
  body('file_type').optional().isIn(['pdf', 'word', 'none']).withMessage('文件类型无效'),
  body('file_url').optional(),
  body('file_name').optional(),
  body('storage_type').optional().isIn(['local', 'oss', 'hybrid']).withMessage('存储类型无效'),
  body('allowed_job_types').optional().isArray().withMessage('工种分配必须是数组格式')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { 
      title, content, category, required_reading_time,
      file_type, file_url, file_name, storage_type, allowed_job_types
    } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (required_reading_time !== undefined) {
      updateFields.push('required_reading_time = ?');
      updateValues.push(required_reading_time);
    }
    if (file_type !== undefined) {
      updateFields.push('file_type = ?');
      updateValues.push(file_type);
    }
    if (file_url !== undefined) {
      updateFields.push('file_url = ?');
      updateValues.push(file_url);
    }
    if (file_name !== undefined) {
      updateFields.push('file_name = ?');
      updateValues.push(file_name);
    }
    if (storage_type !== undefined) {
      updateFields.push('storage_type = ?');
      updateValues.push(storage_type);
    }
    if (allowed_job_types !== undefined) {
      updateFields.push('allowed_job_types = ?');
      let jobTypesData = null;
      if (allowed_job_types && Array.isArray(allowed_job_types) && allowed_job_types.length > 0) {
        jobTypesData = JSON.stringify(allowed_job_types);
      }
      updateValues.push(jobTypesData);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }
    
    updateValues.push(id);
    
    const [result] = await pool.execute(
      `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    res.json({
      success: true,
      message: '文章更新成功'
    });
  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除文章
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM articles WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }
    
    res.json({
      success: true,
      message: '文章删除成功'
    });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 