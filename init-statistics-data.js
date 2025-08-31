/**
 * 通过API初始化统计数据
 * 用于本地测试环境
 */

const API_BASE = 'http://localhost:3001';

// 创建测试数据
async function initializeStatistics() {
  console.log('🚀 开始初始化统计数据...\n');
  
  try {
    // 1. 检查服务器是否运行
    console.log('1. 检查服务器连接...');
    try {
      const healthResponse = await fetch(`${API_BASE}/api/health`);
      if (!healthResponse.ok) {
        throw new Error('服务器未响应');
      }
      console.log('✅ 服务器连接正常\n');
    } catch (error) {
      throw new Error('无法连接到服务器，请确保后端服务正在运行在 http://localhost:3002');
    }
    
    // 2. 管理员登录
    console.log('2. 正在登录管理员账号...');
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
      throw new Error('管理员登录失败: ' + (loginData.error || '用户名或密码错误'));
    }
    
    const adminToken = loginData.token;
    console.log('✅ 管理员登录成功\n');
    
    // 3. 获取当前用户和文章列表
    console.log('3. 获取基础数据...');
    
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
    
    // 4. 创建学习记录（通过SQL）
    console.log('4. 创建测试学习记录...');
    console.log('   由于API限制，请在DMS中执行以下SQL来创建测试数据：\n');
    
    console.log('-- 插入测试学习记录');
    console.log('INSERT INTO learning_records (user_id, article_id, study_time, score, completed, completed_at)');
    console.log('VALUES');
    
    // 生成SQL插入语句
    let sqlValues = [];
    users.slice(0, 5).forEach(user => {
      if (user.role !== 'admin') {
        articles.slice(0, 2).forEach(article => {
          const studyTime = Math.floor(Math.random() * 120) + 10;
          const score = Math.floor(Math.random() * 40) + 60;
          const completed = Math.random() > 0.3 ? 1 : 0;
          const completedAt = completed ? `NOW() - INTERVAL ${Math.floor(Math.random() * 30)} DAY` : 'NULL';
          
          sqlValues.push(`(${user.id}, ${article.id}, ${studyTime}, ${score}, ${completed}, ${completedAt})`);
        });
      }
    });
    
    console.log(sqlValues.join(',\n') + ';\n');
    
    // 5. 测试统计接口
    console.log('5. 测试统计接口...');
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
      console.log('❌ 统计接口异常（状态码：' + statsResponse.status + '）');
      console.log('   请确保已重启后端服务以加载新路由');
    }
    
    console.log('\n🎉 初始化完成！');
    console.log('\n下一步:');
    console.log('1. 如果统计接口返回404，请重启后端服务：');
    console.log('   cd server && npm start');
    console.log('2. 访问 http://localhost:5175/ 登录管理员账号');
    console.log('3. 点击"管理后台"查看概览页面');
    console.log('4. 或访问 http://localhost:5175/test-overview-statistics.html 进行测试');
    
  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.log('\n请确保:');
    console.log('1. 后端服务正在运行 (http://localhost:3002)');
    console.log('2. 已添加新的统计路由到 server/app.js');
    console.log('3. 数据库连接正常');
    console.log('4. 已在DMS中创建了必要的数据库表');
  }
}

// 执行初始化
initializeStatistics();
