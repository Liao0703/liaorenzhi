 #手动修复文件上传数据库问题

## 步骤1：在服务器上创建SQL文件

在服务器上执行：
```bash
cd /www/wwwroot/learning-platform
```

创建文件 `fix-database-encoding-and-upload.sql`：
```bash
cat > fix-database-encoding-and-upload.sql << 'EOF'
-- 修复数据库字符集和文件上传记录问题
-- 执行时间: 2025-01-23

-- 1. 修改数据库字符集
ALTER DATABASE learning_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 修复articles表字符集
ALTER TABLE articles 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 3. 修复各字段字符集
ALTER TABLE articles 
MODIFY id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 确保文件相关字段存在
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(10) DEFAULT 'none' COMMENT '文件类型: pdf, word, none',
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
ADD COLUMN IF NOT EXISTS file_id VARCHAR(100) DEFAULT NULL COMMENT '文件ID',
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型: local, oss, hybrid',
ADD COLUMN IF NOT EXISTS required_reading_time INT DEFAULT 30 COMMENT '要求阅读时间(分钟)';

-- 5. 修复其他相关表的字符集
ALTER TABLE users 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

ALTER TABLE learning_records 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 6. 查看修复后的表结构
SHOW CREATE TABLE articles;

-- 7. 输出完成信息
SELECT '数据库字符集修复完成！' AS status;
EOF
```

## 步骤2：执行数据库修复

通过宝塔面板或命令行执行：
```bash
mysql -u root -p'your_mysql_password' learning_platform < fix-database-encoding-and-upload.sql
```

## 步骤3：备份原文件路由

```bash
cd /www/wwwroot/learning-platform/server/routes
cp files-simple.js files-simple.js.bak
```

## 步骤4：创建新的文件路由

创建文件 `/www/wwwroot/learning-platform/server/routes/files-with-article.js`：
```bash
cat > files-with-article.js << 'EOF'
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

// 其他路由保持不变...
// 复制原来的下载、预览、删除等路由

module.exports = router;
EOF
```

## 步骤5：安装依赖

```bash
cd /www/wwwroot/learning-platform/server
npm install uuid
```

如果遇到npm错误，使用：
```bash
npm install uuid --registry=https://registry.npmjs.org
```

## 步骤6：更新应用路由

编辑 `/www/wwwroot/learning-platform/server/app.js` 或 `app-simple.js`：

找到：
```javascript
app.use('/api/files', require('./routes/files-simple'));
```

替换为：
```javascript
app.use('/api/files', require('./routes/files-with-article'));
```

## 步骤7：重启服务

通过宝塔面板重启Node项目，或使用命令：
```bash
# 如果安装了pm2
pm2 restart all

# 或者找到进程并重启
ps aux | grep node
kill -9 [进程ID]
# 然后通过宝塔面板启动
```

## 验证修复效果

1. 在phpMyAdmin中执行：
   ```sql
   SHOW CREATE TABLE articles;
   ```
   确认字符集为 `utf8mb4`

2. 测试文件上传：
   - 上传一个中文命名的PDF文件
   - 在phpMyAdmin中查看articles表
   - 确认有新记录且标题无乱码

3. 查看分类是否正确识别

## 常见问题解决

### PM2未安装
如果服务器没有安装PM2，通过宝塔面板的Node项目管理界面重启。

### UUID模块安装失败
使用以下命令：
```bash
npm config set registry https://registry.npmjs.org
npm install uuid
```

### 数据库连接错误
检查 `/www/wwwroot/learning-platform/server/config/database.js` 中的配置是否正确。


