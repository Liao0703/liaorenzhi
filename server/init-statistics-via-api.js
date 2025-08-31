/**
 * 通过API初始化统计数据
 * 用于本地测试环境
 */

const API_BASE = 'http://localhost:3002';

// 创建测试数据
async function initializeStatistics() {
  console.log('🚀 开始初始化统计数据...\n');
  
  try {
    // 1. 管理员登录
    console.log('1. 正在登录管理员账号...');
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
      throw new Error('管理员登录失败: ' + loginData.error);
    }
    
    const adminToken = loginData.token;
    console.log('✅ 管理员登录成功\n');
    
    // 2. 获取当前用户和文章列表
    console.log('2. 获取基础数据...');
    
    // 获取用户列表
    const usersResponse = await fetch(`${API_BASE}/api/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const usersData = await usersResponse.json();
    const users = usersData.data || [];
    console.log(`   找到 ${users.length} 个用户`);
    
    // 获取文章列表
    const articlesResponse = await fetch(`${API_BASE}/api/articles`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const articlesData = await articlesResponse.json();
    const articles = articlesData.data || [];
    console.log(`   找到 ${articles.length} 篇文章\n`);
    
    // 3. 为每个用户创建学习记录
    console.log('3. 创建学习记录...');
    let recordCount = 0;
    
    for (const user of users.slice(0, 10)) { // 只处理前10个用户作为示例
      if (user.role === 'admin') continue; // 跳过管理员
      
      // 为每个用户随机创建1-5条学习记录
      const recordsToCreate = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < recordsToCreate && i < articles.length; i++) {
        const article = articles[Math.floor(Math.random() * articles.length)];
        
        try {
          // 创建学习记录
          const recordData = {
            userId: user.id,
            articleId: article.id,
            studyTime: Math.floor(Math.random() * 120) + 10, // 10-130分钟
            progress: Math.random() > 0.3 ? 100 : Math.floor(Math.random() * 90), // 70%概率完成
            score: Math.random() > 0.3 ? Math.floor(Math.random() * 40) + 60 : 0, // 60-100分
            completed: Math.random() > 0.3
          };
          
          const recordResponse = await fetch(`${API_BASE}/api/learning-records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(recordData)
          });
          
          if (recordResponse.ok) {
            recordCount++;
            process.stdout.write(`\r   已创建 ${recordCount} 条学习记录...`);
          }
        } catch (err) {
          // 忽略单条记录的错误
        }
      }
    }
    
    console.log(`\n✅ 成功创建 ${recordCount} 条学习记录\n`);
    
    // 4. 测试统计接口
    console.log('4. 测试统计接口...');
    const statsResponse = await fetch(`${API_BASE}/api/overview-statistics/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      if (statsData.success) {
        console.log('✅ 统计接口正常');
        console.log('\n📊 当前统计数据:');
        console.log(`   总用户数: ${statsData.data.stats.totalUsers}`);
        console.log(`   活跃用户: ${statsData.data.stats.activeUsers}`);
        console.log(`   文章总数: ${statsData.data.stats.totalArticles}`);
        console.log(`   平均完成率: ${statsData.data.stats.averageCompletionRate}%`);
        console.log(`   总学习时长: ${statsData.data.stats.totalStudyTime}小时`);
        console.log(`   平均成绩: ${statsData.data.stats.averageScore}分`);
      }
    } else {
      console.log('❌ 统计接口异常，请检查是否已添加路由');
    }
    
    console.log('\n🎉 初始化完成！');
    console.log('\n下一步:');
    console.log('1. 访问 http://localhost:5175/ 登录管理员账号');
    console.log('2. 点击"管理后台"查看概览页面');
    console.log('3. 或访问 http://localhost:5175/test-overview-statistics.html 进行测试');
    
  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.log('\n请确保:');
    console.log('1. 后端服务正在运行 (http://localhost:3002)');
    console.log('2. 已添加新的统计路由到 server/app.js');
    console.log('3. 数据库连接正常');
  }
}

// 执行初始化
initializeStatistics();
