#!/bin/bash
# 自动为文件上传添加创建文章功能的补丁脚本

echo "=== 为文件上传添加自动创建文章功能 ==="

cd /www/wwwroot/learning-platform/server

# 备份原文件
cp app.js app.js.backup.auto_article.$(date +%Y%m%d_%H%M%S)

# 创建补丁文件
cat > auto_article_patch.js << 'EOF'
// 在文件上传成功后自动创建文章记录的代码片段
// 插入到 fileId = result.insertId; 之后

    // ========== 自动创建文章记录 ==========
    if (req.file.mimetype.includes('pdf') || req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
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
        const fileType = req.file.mimetype.includes('pdf') ? 'PDF' : 'Word';
        const content = `这是一个${fileType}文档。\n\n📄 文件名: ${req.file.originalname}\n📁 文件类型: ${fileType}\n📊 文件大小: ${Math.round(req.file.size / 1024)} KB\n📅 上传时间: ${new Date().toLocaleString('zh-CN')}\n\n文档已上传到服务器，可以在线查看。`;

        // 插入文章记录
        const [articleResult] = await pool.execute(
          'INSERT INTO articles (title, content, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [title, content, category, 'published']
        );

        console.log('✅ 文章记录已自动创建，ID:', articleResult.insertId);
        
        // 修改响应，添加文章信息
        const responseData = {
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
        };
        
        res.json(responseData);
        return;
      } catch (articleError) {
        console.error('⚠️ 自动创建文章失败:', articleError.message);
        // 继续正常的文件上传响应
      }
    }
    // ========== 结束自动创建文章 ==========
EOF

# 使用sed插入代码
# 在 fileId = result.insertId; 这行之后插入自动创建文章的代码
sed -i '/fileId = result\.insertId;/r auto_article_patch.js' app.js

# 清理临时文件
rm auto_article_patch.js

# 重启应用
npx pm2 restart learning-platform

echo "=== 修改完成 ==="
echo "现在上传PDF或Word文件时会自动创建文章记录"
echo "文章标题会根据文件名生成"
echo "文章分类会根据文件名中的关键词自动判断"
