// 修复文章上传后的编码和分类问题

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'learning_platform',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  timezone: '+08:00'
};

// 智能分类识别函数
function detectCategory(filename, content = '') {
  const name = filename.toLowerCase();
  const text = (filename + ' ' + content).toLowerCase();
  
  // 安全相关
  if (text.includes('安全') || text.includes('防控') || text.includes('防护') || 
      text.includes('事故') || text.includes('应急') || text.includes('消防')) {
    return '安全规程';
  }
  
  // 设备维护相关
  if (text.includes('设备') || text.includes('维护') || text.includes('保养') || 
      text.includes('检修') || text.includes('故障') || text.includes('维修')) {
    return '设备维护';
  }
  
  // 应急处理相关
  if (text.includes('应急') || text.includes('处理') || text.includes('预案') || 
      text.includes('处置') || text.includes('救援')) {
    return '应急处理';
  }
  
  // 信号系统相关
  if (text.includes('信号') || text.includes('通信') || text.includes('联锁') || 
      text.includes('闭塞') || text.includes('控制')) {
    return '信号系统';
  }
  
  // 调度规范相关
  if (text.includes('调度') || text.includes('行车') || text.includes('运输') || 
      text.includes('计划') || text.includes('组织')) {
    return '调度规范';
  }
  
  // 作业标准相关
  if (text.includes('作业') || text.includes('标准') || text.includes('流程') || 
      text.includes('操作') || text.includes('规程') || text.includes('工作')) {
    return '作业标准';
  }
  
  // 培训资料（默认分类）
  return '培训资料';
}

async function fixArticleEncoding() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 修复数据库表的字符集
    console.log('\n📝 修复数据库表字符集...');
    await connection.execute(`
      ALTER TABLE articles 
      CONVERT TO CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ articles表字符集已修复为utf8mb4');
    
    // 2. 修复现有文章数据
    console.log('\n📝 修复现有文章数据...');
    const [articles] = await connection.execute('SELECT * FROM articles');
    console.log(`找到 ${articles.length} 篇文章需要处理`);
    
    for (const article of articles) {
      // 检测并修复乱码
      let title = article.title;
      let category = article.category;
      let content = article.content || '';
      
      // 如果标题包含乱码特征，尝试从content中提取信息
      if (title.includes('�') || title.includes('¿') || title.includes('Â')) {
        console.log(`\n⚠️  检测到乱码文章 ID: ${article.id}`);
        
        // 尝试从文件名恢复标题
        if (article.file_name) {
          title = article.file_name.replace(/\.[^/.]+$/, '');
          console.log(`  从文件名恢复标题: ${title}`);
        } else {
          title = `培训资料_${article.id}`;
          console.log(`  使用默认标题: ${title}`);
        }
      }
      
      // 重新检测分类
      const detectedCategory = detectCategory(title, content);
      if (category !== detectedCategory) {
        console.log(`  分类更新: ${category} -> ${detectedCategory}`);
        category = detectedCategory;
      }
      
      // 更新数据库
      await connection.execute(
        'UPDATE articles SET title = ?, category = ? WHERE id = ?',
        [title, category, article.id]
      );
      console.log(`✅ 文章 ID ${article.id} 已修复`);
    }
    
    // 3. 创建改进的文件上传处理代码
    console.log('\n📝 生成改进的文件上传处理代码...');
    
    const improvedUploadCode = `
// 改进的文件上传处理（确保正确的编码和智能分类）
// 将此代码添加到 server/app.js 的文件上传接口中

// 在文件上传接口的末尾添加自动创建文章的逻辑
if (fileTypeForArticle !== 'none') {
  try {
    // 确保使用UTF-8编码处理文件名
    const originalNameBuffer = Buffer.from(req.file.originalname, 'latin1');
    const originalNameUtf8 = originalNameBuffer.toString('utf8');
    
    // 从文件名生成标题（去掉扩展名）
    let title = originalNameUtf8.replace(/\\.[^/.]+$/, '');
    if (!title || title.trim() === '') {
      title = \`文档资料_\${new Date().toLocaleString('zh-CN')}\`;
    }
    
    // 智能分类检测
    const category = detectCategory(title);
    
    // 创建文章内容
    const content = \`这是一个\${fileTypeForArticle.toUpperCase()}文档。
    
📄 文件名: \${originalNameUtf8}
📁 文件类型: \${fileTypeForArticle.toUpperCase()}
📊 文件大小: \${Math.round(req.file.size / 1024)} KB
📅 上传时间: \${new Date().toLocaleString('zh-CN')}

文档已上传到服务器，可以在线查看。\`;
    
    // 插入文章记录（确保使用正确的字符集）
    const [articleResult] = await pool.execute(
      'INSERT INTO articles (title, content, category, status, file_type, file_name, file_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [title, content, category, 'published', fileTypeForArticle, originalNameUtf8, \`/uploads/\${req.file.filename}\`]
    );
    
    console.log('✅ 文章记录已自动创建，ID:', articleResult.insertId);
    console.log('  标题:', title);
    console.log('  分类:', category);
  } catch (articleError) {
    console.error('⚠️ 自动创建文章失败:', articleError);
  }
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
`;
    
    // 保存改进的代码到文件
    fs.writeFileSync(
      path.join(__dirname, 'improved-upload-handler.js'),
      improvedUploadCode,
      'utf8'
    );
    console.log('✅ 改进的上传处理代码已保存到 improved-upload-handler.js');
    
    // 4. 显示统计信息
    console.log('\n📊 修复统计:');
    const [categoryCounts] = await connection.execute(`
      SELECT category, COUNT(*) as count 
      FROM articles 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    console.log('\n文章分类分布:');
    categoryCounts.forEach(row => {
      console.log(`  ${row.category}: ${row.count} 篇`);
    });
    
    console.log('\n✅ 所有修复已完成！');
    console.log('\n下一步操作:');
    console.log('1. 将 improved-upload-handler.js 中的代码添加到服务器的文件上传接口');
    console.log('2. 重启服务器使更改生效');
    console.log('3. 后续上传的文件将自动获得正确的编码和分类');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行修复
fixArticleEncoding();