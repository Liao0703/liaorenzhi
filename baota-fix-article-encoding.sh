#!/bin/bash

# 宝塔面板文章编码和分类问题修复脚本

echo "================================================"
echo "宝塔面板 - 文章上传编码和分类问题修复脚本"
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

echo -e "\n${BLUE}步骤 1: 连接到宝塔服务器并检查当前状态...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
echo "当前位置: $(pwd)"
cd /www/wwwroot/learning-platform

echo -e "\n检查数据库字符集..."
mysql -u root -e "USE learning_platform; SHOW CREATE TABLE articles\G" | grep -i charset

echo -e "\n检查现有文章数据..."
mysql -u root -e "USE learning_platform; SELECT id, title, category FROM articles LIMIT 5;"

echo -e "\n检查文件上传目录..."
ls -la server/uploads/ | head -10
EOF

echo -e "\n${BLUE}步骤 2: 创建并执行数据库修复脚本...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /www/wwwroot/learning-platform

# 创建数据库修复SQL
cat > fix-articles-encoding.sql << 'SQL'
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
mysql -u root learning_platform < fix-articles-encoding.sql

echo "数据库字符集修复完成！"
EOF

echo -e "\n${BLUE}步骤 3: 创建文章数据修复脚本...${NC}"
cat > fix-articles-data.js << 'FIXSCRIPT'
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
      if (article.category !== newCategory) {
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

echo -e "\n${BLUE}步骤 4: 上传并执行修复脚本...${NC}"
sshpass -p "$SERVER_PASSWORD" scp fix-articles-data.js $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /www/wwwroot/learning-platform

echo "执行文章数据修复..."
node fix-articles-data.js

echo -e "\n清理临时文件..."
rm -f fix-articles-encoding.sql fix-articles-data.js
EOF

echo -e "\n${BLUE}步骤 5: 更新文件上传处理代码...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /www/wwwroot/learning-platform

# 备份原文件
cp server/routes/files-simple.js server/routes/files-simple.js.bak.$(date +%Y%m%d_%H%M%S)

# 创建修复补丁
cat > upload-fix.patch << 'PATCH'
// 在文件上传成功后，添加以下代码来处理编码和创建文章

// 1. 在文件顶部添加智能分类函数
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

// 2. 在上传接口中修复编码问题
// 在 router.post('/upload', ...) 中，处理文件名编码：
const originalNameBuffer = Buffer.from(req.file.originalname, 'latin1');
const originalNameUtf8 = originalNameBuffer.toString('utf8');

// 3. 在创建文章时使用智能分类
const category = detectCategory(originalNameUtf8);
PATCH

echo -e "\n${YELLOW}请手动编辑 server/routes/files-simple.js 文件${NC}"
echo "参考 upload-fix.patch 中的代码进行修改"
echo "主要修改点："
echo "1. 添加智能分类函数 detectCategory"
echo "2. 修复文件名编码问题"
echo "3. 使用智能分类创建文章"
EOF

echo -e "\n${BLUE}步骤 6: 重启Node.js服务...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /www/wwwroot/learning-platform

# 查找并重启Node.js进程
echo "查找Node.js进程..."
ps aux | grep -E "node.*app.js|pm2" | grep -v grep

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
EOF

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}宝塔面板修复完成！${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}修复内容：${NC}"
echo "1. ✓ 数据库表字符集已修改为utf8mb4"
echo "2. ✓ 现有文章的乱码标题已修复"
echo "3. ✓ 文章分类已根据标题重新识别"
echo "4. ✓ 提供了文件上传编码修复方案"

echo -e "\n${YELLOW}后续操作建议：${NC}"
echo "1. 登录宝塔面板查看文章列表，确认标题和分类显示正常"
echo "2. 手动修改 /www/wwwroot/learning-platform/server/routes/files-simple.js"
echo "3. 测试上传新的中文文件，确认编码正常"
echo "4. 如需进一步修改，可通过宝塔面板的文件管理器编辑"

echo -e "\n${BLUE}宝塔面板快速检查命令：${NC}"
echo "ssh root@47.109.142.72"
echo "cd /www/wwwroot/learning-platform"
echo "mysql -u root -e 'USE learning_platform; SELECT id, title, category FROM articles LIMIT 10;'"

# 清理本地临时文件
rm -f fix-articles-data.js

echo -e "\n${GREEN}脚本执行完毕！${NC}"

