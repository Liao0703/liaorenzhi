const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

// 文件上传API
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    const fileInfo = {
      success: true,
      fileId: path.parse(req.file.filename).name,
      fileName: req.file.originalname,
      fileUrl: `/api/files/download/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadTime: new Date().toISOString(),
      serverPath: req.file.path
    };

    console.log('文件上传成功:', fileInfo);
    res.json(fileInfo);

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
router.delete('/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    fs.unlinkSync(filePath);
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
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const fileInfos = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename: filename,
        originalName: filename,
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
        downloadUrl: `/api/files/download/${filename}`,
        previewUrl: `/api/files/preview/${filename}`
      };
    });

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
