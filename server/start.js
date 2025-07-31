const { testConnection, initDatabase } = require('./config/database');

async function startServer() {
  console.log('🚀 正在启动学习平台后端服务...');
  
  try {
    // 测试数据库连接
    console.log('📊 测试数据库连接...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      console.log('💡 请确保：');
      console.log('   1. MySQL服务已启动');
      console.log('   2. 数据库配置正确');
      console.log('   3. 已创建数据库 learning_platform');
      process.exit(1);
    }
    
    // 初始化数据库表
    console.log('🗄️ 初始化数据库表...');
    await initDatabase();
    
    // 启动Express服务器
    console.log('🌐 启动Web服务器...');
    require('./app');
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

startServer(); 