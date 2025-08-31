const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 智能分类检测函数
function detectCategory(filename) {
  const name = filename.toLowerCase();
  
  if (name.includes('安全') || name.includes('防控') || name.includes('防护')) {
    return '安全规程';
  }
  if (name.includes('设备') || name.includes('维护') || name.includes('保养')) {
    return '设备维护';
  }
  if (name.includes('应急') || name.includes('处理') || name.includes('预案')) {
    return '应急处理';
  }
  if (name.includes('信号') || name.includes('通信') || name.includes('联锁')) {
    return '信号系统';
  }
  if (name.includes('调度') || name.includes('行车') || name.includes('运输')) {
    return '调度规范';
  }
  if (name.includes('作业') || name.includes('标准') || name.includes('流程')) {
    return '作业标准';
  }
  
  return '培训资料';
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    const fileName = `${uniqueId}${extension}`;
    cb(null, fileName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/html',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 文件上传API - 自动创建文章记录
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 修复中文文件名编码
    const originalNameBuffer = Buffer.from(req.file.originalname, 'latin1');
    const originalNameUtf8 = originalNameBuffer.toString('utf8');

    const fileInfo = {
      fileId: path.parse(req.file.filename).name,
      fileName: originalNameUtf8,
      fileUrl: `/api/files/download/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadTime: new Date().toISOString(),
      serverPath: req.file.path
    };

    // 确定文件类型
    let fileTypeForDb = 'none';
    if (req.file.mimetype === 'application/pdf') {
      fileTypeForDb = 'pdf';
    } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
      fileTypeForDb = 'word';
    }

    // 自动检测分类
    const category = detectCategory(originalNameUtf8);

    // 生成文章标题（去除扩展名）
    const title = originalNameUtf8.replace(/\.[^/.]+$/, '');

    // 创建文章记录
    const articleId = uuidv4();
    const content = JSON.stringify({
      type: 'file',
      fileName: originalNameUtf8,
      fileUrl: fileInfo.fileUrl,
      uploadTime: fileInfo.uploadTime,
      fileSize: fileInfo.fileSize,
      description: `文件：${originalNameUtf8}`
    });

    try {
      await pool.execute(
        `INSERT INTO articles 
         (id, title, content, category, file_type, file_url, file_name, file_id, storage_type, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          articleId,
          title,
          content,
          category,
          fileTypeForDb,
          fileInfo.fileUrl,
          originalNameUtf8,
          fileInfo.fileId,
          'local',
          'published'
        ]
      );

      console.log('文章记录创建成功:', {
        articleId,
        title,
        category,
        fileType: fileTypeForDb
      });

      // 返回文件信息和文章信息
      res.json({
        success: true,
        ...fileInfo,
        article: {
          id: articleId,
          title,
          category,
          fileType: fileTypeForDb
        }
      });

    } catch (dbError) {
      console.error('创建文章记录失败:', dbError);
      // 即使数据库失败，文件已上传成功，仍返回文件信息
      res.json({
        success: true,
        ...fileInfo,
        warning: '文件上传成功，但创建文章记录失败'
      });
    }

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '文件上传失败'
    });
  }
});

// 文件下载API
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    // 设置下载头
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.sendFile(filePath);

  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({
      success: false,
      error: '文件下载失败'
    });
  }
});

// 文件预览API
router.get('/preview/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    // 直接发送文件用于预览
    res.sendFile(filePath);

  } catch (error) {
    console.error('文件预览失败:', error);
    res.status(500).json({
      success: false,
      error: '文件预览失败'
    });
  }
});

// 文件删除API
router.delete('/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    // 删除文件
    fs.unlinkSync(filePath);

    // 同时删除相关的文章记录
    try {
      await pool.execute(
        'DELETE FROM articles WHERE file_url = ?',
        [`/api/files/download/${filename}`]
      );
    } catch (dbError) {
      console.error('删除文章记录失败:', dbError);
    }

    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('文件删除失败:', error);
    res.status(500).json({
      success: false,
      error: '文件删除失败'
    });
  }
});

// 获取文件列表API
router.get('/list', async (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const fileInfos = [];

    for (const filename of files) {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      // 查询对应的文章信息
      let articleInfo = null;
      try {
        const [articles] = await pool.execute(
          'SELECT id, title, category FROM articles WHERE file_url = ?',
          [`/api/files/download/${filename}`]
        );
        if (articles.length > 0) {
          articleInfo = articles[0];
        }
      } catch (dbError) {
        console.error('查询文章信息失败:', dbError);
      }

      fileInfos.push({
        filename: filename,
        originalName: filename,
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
        downloadUrl: `/api/files/download/${filename}`,
        previewUrl: `/api/files/preview/${filename}`,
        article: articleInfo
      });
    }

    res.json({
      success: true,
      files: fileInfos,
      total: fileInfos.length
    });

  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文件列表失败'
    });
  }
});

// 健康检查API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '文件服务正常',
    uploadDir: uploadDir,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;


