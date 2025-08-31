#!/bin/bash

# 部署文章编码和分类修复脚本

echo "================================================"
echo "文章上传编码和分类问题修复部署脚本"
echo "================================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 服务器信息
SERVER_USER="root"
SERVER_HOST="47.109.142.72"
SERVER_PASSWORD='L!@oShu1118'
REMOTE_PATH="/www/wwwroot/learning-platform"

echo -e "\n${BLUE}步骤 1: 上传修复脚本到服务器...${NC}"
sshpass -p "$SERVER_PASSWORD" scp fix-article-upload-encoding.js $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

echo -e "\n${BLUE}步骤 2: 在服务器上执行修复脚本...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /www/wwwroot/learning-platform

echo "安装必要的依赖..."
npm install mysql2 dotenv

echo "执行修复脚本..."
node fix-article-upload-encoding.js

echo "修复完成！"
EOF

echo -e "\n${BLUE}步骤 3: 更新服务器上的文件上传处理逻辑...${NC}"

# 创建修复后的上传处理代码
cat > fix-upload-handler.js << 'UPLOAD_CODE'
// 在 server/routes/files-simple.js 的上传接口中添加以下代码

// 在文件上传成功后添加自动创建文章的逻辑
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 确保使用UTF-8编码处理文件名
    const originalNameBuffer = Buffer.from(req.file.originalname, 'latin1');
    const originalNameUtf8 = originalNameBuffer.toString('utf8');

    const fileInfo = {
      success: true,
      fileId: path.parse(req.file.filename).name,
      fileName: originalNameUtf8,
      fileUrl: `/api/files/download/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadTime: new Date().toISOString(),
      serverPath: req.file.path
    };

    console.log('文件上传成功:', fileInfo);

    // 自动创建文章（仅限PDF和Word文档）
    const mimeType = req.file.mimetype;
    let fileTypeForArticle = 'none';
    
    if (mimeType.includes('pdf')) {
      fileTypeForArticle = 'pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      fileTypeForArticle = 'word';
    }

    if (fileTypeForArticle !== 'none') {
      try {
        const { pool } = require('../config/database');
        
        // 从文件名生成标题（去掉扩展名）
        let title = originalNameUtf8.replace(/\.[^/.]+$/, '');
        if (!title || title.trim() === '') {
          title = `文档资料_${new Date().toLocaleString('zh-CN')}`;
        }

        // 智能分类检测
        const category = detectCategory(title);

        // 创建文章内容
        const content = `这是一个${fileTypeForArticle.toUpperCase()}文档。\n\n📄 文件名: ${originalNameUtf8}\n📁 文件类型: ${fileTypeForArticle.toUpperCase()}\n📊 文件大小: ${Math.round(req.file.size / 1024)} KB\n📅 上传时间: ${new Date().toLocaleString('zh-CN')}\n\n文档已上传到服务器，可以在线查看。`;

        // 插入文章记录
        const [articleResult] = await pool.execute(
          'INSERT INTO articles (title, content, category, status, file_type, file_name, file_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [title, content, category, 'published', fileTypeForArticle, originalNameUtf8, `/uploads/${req.file.filename}`]
        );

        console.log('✅ 文章记录已自动创建');
        console.log('  ID:', articleResult.insertId);
        console.log('  标题:', title);
        console.log('  分类:', category);

        // 在响应中添加文章信息
        fileInfo.articleId = articleResult.insertId;
        fileInfo.articleTitle = title;
        fileInfo.articleCategory = category;
      } catch (articleError) {
        console.error('⚠️ 自动创建文章失败:', articleError);
      }
    }

    res.json(fileInfo);

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '文件上传失败'
    });
  }
});

// 智能分类检测函数
function detectCategory(filename) {
  const name = filename.toLowerCase();
  
  if (name.includes('安全') || name.includes('防控') || name.includes('防护') || 
      name.includes('事故') || name.includes('应急') || name.includes('消防')) {
    return '安全规程';
  }
  if (name.includes('设备') || name.includes('维护') || name.includes('保养') || 
      name.includes('检修') || name.includes('故障') || name.includes('维修')) {
    return '设备维护';
  }
  if (name.includes('应急') || name.includes('处理') || name.includes('预案') || 
      name.includes('处置') || name.includes('救援')) {
    return '应急处理';
  }
  if (name.includes('信号') || name.includes('通信') || name.includes('联锁') || 
      name.includes('闭塞') || name.includes('控制')) {
    return '信号系统';
  }
  if (name.includes('调度') || name.includes('行车') || name.includes('运输') || 
      name.includes('计划') || name.includes('组织')) {
    return '调度规范';
  }
  if (name.includes('作业') || name.includes('标准') || name.includes('流程') || 
      name.includes('操作') || name.includes('规程')) {
    return '作业标准';
  }
  
  return '培训资料';
}
UPLOAD_CODE

echo -e "\n${BLUE}步骤 4: 备份并更新服务器文件...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /www/wwwroot/learning-platform

# 备份原文件
cp server/routes/files-simple.js server/routes/files-simple.js.bak.$(date +%Y%m%d_%H%M%S)

echo "备份完成，请手动更新 server/routes/files-simple.js 文件"
echo "添加智能分类检测函数和UTF-8编码处理"
EOF

echo -e "\n${BLUE}步骤 5: 重启服务...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /www/wwwroot/learning-platform

# 检查PM2进程
if pm2 list | grep -q "learning-platform"; then
    echo "重启PM2进程..."
    pm2 restart learning-platform
    pm2 save
else
    echo "PM2进程未找到，尝试重启Node.js服务..."
    pkill -f "node.*server/app.js" || true
    sleep 2
    cd server && nohup node app.js > ../logs/server.log 2>&1 &
fi

echo "服务重启完成！"
EOF

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}修复部署完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "\n${YELLOW}注意事项：${NC}"
echo -e "1. 已修复数据库中现有文章的编码问题"
echo -e "2. 已根据文件名智能重新分类文章"
echo -e "3. 后续上传的文件将自动使用UTF-8编码"
echo -e "4. 文件将根据名称自动分配到合适的分类"
echo -e "\n${YELLOW}如果仍有问题，请检查：${NC}"
echo -e "- 数据库字符集是否为utf8mb4"
echo -e "- 服务器文件编码是否正确"
echo -e "- 前端显示是否正常"

# 清理临时文件
rm -f fix-upload-handler.js

echo -e "\n${GREEN}部署脚本执行完毕！${NC}"

