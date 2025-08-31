// 修改文件上传接口，自动创建文章记录
// 在服务器上的 /www/wwwroot/learning-platform/server/app.js 文件中
// 找到 app.post('/api/files/upload', ...) 部分，修改为：

app.post('/api/files/upload', cors(corsOptions), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    console.log('文件上传成功:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });

    // 获取用户信息（从请求头或会话中）
    const userId = req.headers['user-id'] || req.body.userId || 1; // 默认用户ID
    
    // 确定文件类型
    let uploadType = 'document';
    let fileTypeForArticle = 'none';
    const mimeType = req.file.mimetype;
    
    if (mimeType.startsWith('image/')) {
      uploadType = 'image';
    } else if (mimeType.startsWith('video/')) {
      uploadType = 'video';
    } else if (mimeType.includes('pdf')) {
      fileTypeForArticle = 'pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      fileTypeForArticle = 'word';
    }

    // 将文件记录保存到数据库
    const { pool } = require('./config/database');
    let fileId;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO uploaded_files 
         (user_id, filename, original_name, file_type, file_size, file_path, upload_type, processing_status, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          req.file.filename,
          req.file.originalname,
          mimeType,
          req.file.size,
          req.file.path,
          uploadType,
          'processed',
          JSON.stringify({
            uploadTime: new Date().toISOString(),
            serverPath: req.file.path,
            destination: req.file.destination
          })
        ]
      );
      fileId = result.insertId;
      console.log('✅ 文件记录已保存到云数据库，ID:', fileId);
    } catch (dbError) {
      console.warn('⚠️ 数据库保存失败，使用内存存储:', dbError.message);
      fileId = Date.now(); // 降级使用时间戳作为ID
    }

    // ========== 新增：自动创建文章记录 ==========
    if (fileTypeForArticle !== 'none') {
      try {
        // 从文件名生成标题（去掉扩展名）
        let title = req.file.originalname.replace(/\.[^/.]+$/, '');
        if (!title || title.trim() === '') {
          title = `文档资料_${new Date().toLocaleString('zh-CN')}`;
        }

        // 根据文件名猜测分类
        let category = '培训资料'; // 默认分类
        if (title.includes('安全') || title.includes('防控')) {
          category = '安全培训';
        } else if (title.includes('操作') || title.includes('规程')) {
          category = '操作规程';
        } else if (title.includes('制度') || title.includes('管理')) {
          category = '规章制度';
        }

        // 创建文章内容
        const content = `这是一个${fileTypeForArticle.toUpperCase()}文档。\n\n📄 文件名: ${req.file.originalname}\n📁 文件类型: ${fileTypeForArticle.toUpperCase()}\n📊 文件大小: ${Math.round(req.file.size / 1024)} KB\n📅 上传时间: ${new Date().toLocaleString('zh-CN')}\n\n文档已上传到服务器，可以在线查看。`;

        // 插入文章记录
        const [articleResult] = await pool.execute(
          'INSERT INTO articles (title, content, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [title, content, category, 'published']
        );

        console.log('✅ 文章记录已自动创建，ID:', articleResult.insertId);
        
        // 在响应中添加文章信息
        res.json({
          success: true,
          message: '文件上传成功，文章已自动创建',
          data: {
            fileId: fileId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
            size: req.file.size,
            articleId: articleResult.insertId,
            articleTitle: title,
            articleCategory: category
          }
        });
        return;
      } catch (articleError) {
        console.error('⚠️ 自动创建文章失败:', articleError.message);
        // 继续返回文件上传成功的响应
      }
    }
    // ========== 结束新增部分 ==========

    // 返回相对路径，前端会根据环境补全为正确域名与协议
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        fileId: fileId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败'
    });
  }
});
