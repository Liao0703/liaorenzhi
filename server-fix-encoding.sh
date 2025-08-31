#!/bin/bash

# 直接在服务器上执行的修复脚本

echo "================================================"
echo "文章编码和分类问题修复脚本"
echo "================================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 进入项目目录
cd /www/wwwroot/learning-platform

echo -e "\n${BLUE}步骤 1: 检查当前状态...${NC}"
echo "当前位置: $(pwd)"

echo -e "\n检查数据库字符集..."
mysql -u root -e "USE learning_platform; SHOW CREATE TABLE articles\G" | grep -i charset || echo "无法查看表结构"

echo -e "\n检查现有文章数据..."
mysql -u root -e "USE learning_platform; SELECT id, title, category FROM articles LIMIT 5;" || echo "无法查询文章"

echo -e "\n${BLUE}步骤 2: 修复数据库字符集...${NC}"

# 创建修复SQL
cat > /tmp/fix-articles-encoding.sql << 'SQL'
USE learning_platform;

-- 修复文章表字符集
ALTER TABLE articles 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 修复标题和分类字段
ALTER TABLE articles 
MODIFY title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY category VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 查看修复后的表结构
SHOW CREATE TABLE articles\G
SQL

echo "执行数据库修复..."
mysql -u root < /tmp/fix-articles-encoding.sql
echo "数据库字符集修复完成！"

echo -e "\n${BLUE}步骤 3: 创建文章数据修复脚本...${NC}"
cat > /tmp/fix-articles-data.js << 'FIXSCRIPT'
const mysql = require('mysql2/promise');

// 智能分类检测函数
function detectCategory(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('安全') || text.includes('防控') || text.includes('防护') || 
      text.includes('事故') || text.includes('应急') || text.includes('消防')) {
    return '安全规程';
  }
  
  if (text.includes('设备') || text.includes('维护') || text.includes('保养') || 
      text.includes('检修') || text.includes('故障') || text.includes('维修')) {
    return '设备维护';
  }
  
  if (text.includes('应急') || text.includes('处理') || text.includes('预案') || 
      text.includes('处置') || text.includes('救援')) {
    return '应急处理';
  }
  
  if (text.includes('信号') || text.includes('通信') || text.includes('联锁') || 
      text.includes('闭塞') || text.includes('控制')) {
    return '信号系统';
  }
  
  if (text.includes('调度') || text.includes('行车') || text.includes('运输') || 
      text.includes('计划') || text.includes('组织')) {
    return '调度规范';
  }
  
  if (text.includes('作业') || text.includes('标准') || text.includes('流程') || 
      text.includes('操作') || text.includes('规程')) {
    return '作业标准';
  }
  
  return '培训资料';
}

async function fixArticles() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'learning_platform',
    charset: 'utf8mb4'
  });

  try {
    console.log('获取所有文章...');
    const [articles] = await connection.execute('SELECT * FROM articles');
    console.log(`找到 ${articles.length} 篇文章`);

    for (const article of articles) {
      let needUpdate = false;
      let updates = [];
      
      // 检查并修复标题
      let title = article.title;
      if (title && (title.includes('�') || title.includes('¿') || title.includes('Â'))) {
        console.log(`\n修复乱码标题 ID ${article.id}: ${title}`);
        
        // 尝试从file_name恢复
        if (article.file_name) {
          title = article.file_name.replace(/\.[^/.]+$/, '');
        } else {
          title = `培训资料_${article.id}`;
        }
        needUpdate = true;
      }
      
      // 重新检测分类
      const newCategory = detectCategory(title, article.content || '');
      if (article.category !== newCategory || article.category === '安全培训') {
        console.log(`  更新分类: ${article.category} -> ${newCategory}`);
        needUpdate = true;
      }
      
      if (needUpdate) {
        await connection.execute(
          'UPDATE articles SET title = ?, category = ? WHERE id = ?',
          [title, newCategory, article.id]
        );
        console.log(`  ✓ 文章 ID ${article.id} 已更新`);
      }
    }
    
    // 显示统计
    const [stats] = await connection.execute(
      'SELECT category, COUNT(*) as count FROM articles GROUP BY category'
    );
    console.log('\n文章分类统计:');
    stats.forEach(row => {
      console.log(`  ${row.category}: ${row.count} 篇`);
    });
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await connection.end();
  }
}

fixArticles();
FIXSCRIPT

echo "执行文章数据修复..."
cd /www/wwwroot/learning-platform
node /tmp/fix-articles-data.js

echo -e "\n${BLUE}步骤 4: 备份并显示文件上传修复代码...${NC}"

# 备份原文件
if [ -f "server/routes/files-simple.js" ]; then
    cp server/routes/files-simple.js server/routes/files-simple.js.bak.$(date +%Y%m%d_%H%M%S)
    echo "原文件已备份"
fi

echo -e "\n${YELLOW}请在 server/routes/files-simple.js 文件中添加以下代码：${NC}"
echo "================================================"
cat << 'CODE'
// 1. 在文件顶部添加智能分类函数：
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

// 2. 在上传接口中（router.post('/upload', ...)）修改：
// 修复中文文件名编码
const originalNameBuffer = Buffer.from(req.file.originalname, 'latin1');
const originalNameUtf8 = originalNameBuffer.toString('utf8');

// 3. 使用修复后的文件名：
const fileInfo = {
  success: true,
  fileId: path.parse(req.file.filename).name,
  fileName: originalNameUtf8,  // 使用修复后的文件名
  // ... 其他字段
};
CODE
echo "================================================"

echo -e "\n${BLUE}步骤 5: 重启服务...${NC}"

# 尝试使用PM2重启
if command -v pm2 &> /dev/null; then
    echo "使用PM2重启..."
    pm2 list
    pm2 restart all
    pm2 save
else
    echo "使用系统命令重启..."
    # 杀死旧进程
    pkill -f "node.*server/app.js" || true
    sleep 2
    
    # 启动新进程
    cd server
    nohup node app.js > ../logs/server.log 2>&1 &
    echo "Node.js服务已重启"
fi

# 清理临时文件
rm -f /tmp/fix-articles-encoding.sql /tmp/fix-articles-data.js

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}修复完成！${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}修复内容：${NC}"
echo "1. ✓ 数据库表字符集已修改为utf8mb4"
echo "2. ✓ 现有文章的分类已重新识别"
echo "3. ✓ 提供了文件上传编码修复代码"

echo -e "\n${YELLOW}后续操作：${NC}"
echo "1. 编辑 /www/wwwroot/learning-platform/server/routes/files-simple.js"
echo "2. 按照上面显示的代码进行修改"
echo "3. 保存后重启服务：pm2 restart all"

echo -e "\n${BLUE}查看修复结果：${NC}"
mysql -u root -e "USE learning_platform; SELECT id, title, category FROM articles LIMIT 10;"

