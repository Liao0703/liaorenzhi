/**
 * 创建测试文章
 */

const API_BASE = 'http://localhost:3001';

async function createTestArticles() {
  console.log('📚 创建测试文章...\n');
  
  try {
    // 1. 管理员登录
    console.log('1. 登录管理员...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('登录失败: ' + loginData.error);
    }
    
    const token = loginData.token;
    console.log('✅ 登录成功\n');
    
    // 2. 创建测试文章
    console.log('2. 创建文章...');
    const articles = [
      {
        title: '安全生产基础知识',
        category: '安全知识',
        content: '这是一篇关于安全生产基础知识的文章...',
        difficulty: 'beginner'
      },
      {
        title: '设备操作规范',
        category: '操作规程',
        content: '本文介绍设备的正确操作方法...',
        difficulty: 'intermediate'
      },
      {
        title: '应急处理流程',
        category: '应急管理',
        content: '当发生紧急情况时的处理流程...',
        difficulty: 'advanced'
      },
      {
        title: '质量管理体系',
        category: '质量管理',
        content: '质量管理的基本原则和方法...',
        difficulty: 'intermediate'
      }
    ];
    
    let createdCount = 0;
    for (const article of articles) {
      try {
        const response = await fetch(`${API_BASE}/api/articles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(article)
        });
        
        if (response.ok) {
          createdCount++;
          console.log(`   ✅ 创建文章: ${article.title}`);
        } else {
          console.log(`   ❌ 创建失败: ${article.title}`);
        }
      } catch (err) {
        console.log(`   ❌ 错误: ${err.message}`);
      }
    }
    
    console.log(`\n✅ 成功创建 ${createdCount} 篇文章`);
    
    // 3. 创建学习记录SQL
    if (createdCount > 0) {
      console.log('\n3. 生成学习记录SQL...');
      console.log('请在DMS中执行以下SQL创建学习记录：\n');
      
      console.log('-- 插入测试学习记录');
      console.log('INSERT INTO learning_records (user_id, article_id, study_time, score, completed, completed_at)');
      console.log('SELECT ');
      console.log('  u.id,');
      console.log('  a.id,');
      console.log('  FLOOR(RAND() * 120) + 10,');
      console.log('  FLOOR(RAND() * 40) + 60,');
      console.log('  IF(RAND() > 0.3, 1, 0),');
      console.log('  IF(RAND() > 0.3, NOW() - INTERVAL FLOOR(RAND() * 30) DAY, NULL)');
      console.log('FROM users u');
      console.log('CROSS JOIN articles a');
      console.log('WHERE u.role = "user"');
      console.log('AND RAND() < 0.5');
      console.log('LIMIT 50;');
    }
    
    console.log('\n🎉 完成！现在可以运行 init-statistics-data.js 了');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

createTestArticles();
