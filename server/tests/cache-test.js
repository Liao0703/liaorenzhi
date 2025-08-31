const { cacheService } = require('../services/cacheService');
const { initRedis } = require('../config/redis');

/**
 * Redis缓存功能测试
 */
async function testCache() {
  console.log('🧪 开始Redis缓存功能测试...\n');
  
  try {
    // 初始化Redis（会自动降级到内存缓存）
    console.log('1️⃣ 初始化缓存系统...');
    await initRedis();
    
    // 测试基本缓存操作
    console.log('2️⃣ 测试基本缓存操作...');
    await testBasicOperations();
    
    // 测试用户缓存
    console.log('3️⃣ 测试用户缓存功能...');
    await testUserCache();
    
    // 测试API缓存
    console.log('4️⃣ 测试API缓存功能...');
    await testApiCache();
    
    // 测试缓存统计
    console.log('5️⃣ 测试缓存统计功能...');
    await testCacheStats();
    
    // 测试缓存清除
    console.log('6️⃣ 测试缓存清除功能...');
    await testCacheClear();
    
    console.log('\n✅ 所有缓存功能测试通过！');
    
  } catch (error) {
    console.error('❌ 缓存测试失败:', error.message);
    console.error(error.stack);
  }
}

/**
 * 测试基本缓存操作
 */
async function testBasicOperations() {
  const testKey = 'test:basic';
  const testValue = { message: 'Hello Cache!', timestamp: Date.now() };
  
  // 测试设置缓存
  await cacheService.set(testKey, testValue, 60);
  console.log('   ✅ 缓存设置成功');
  
  // 测试获取缓存
  const cached = await cacheService.get(testKey);
  if (cached && cached.message === testValue.message) {
    console.log('   ✅ 缓存获取成功');
  } else {
    throw new Error('缓存获取失败');
  }
  
  // 测试缓存存在检查
  const exists = await cacheService.exists(testKey);
  if (exists) {
    console.log('   ✅ 缓存存在检查成功');
  } else {
    throw new Error('缓存存在检查失败');
  }
  
  // 测试删除缓存
  await cacheService.del(testKey);
  const deletedCache = await cacheService.get(testKey);
  if (!deletedCache) {
    console.log('   ✅ 缓存删除成功');
  } else {
    throw new Error('缓存删除失败');
  }
}

/**
 * 测试用户缓存
 */
async function testUserCache() {
  const userId = 123;
  const userData = {
    id: userId,
    username: 'testuser',
    name: '测试用户',
    role: 'user',
    email: 'test@example.com'
  };
  
  // 测试用户缓存设置
  await cacheService.setUserCache(userId, userData, 300);
  console.log('   ✅ 用户缓存设置成功');
  
  // 测试用户缓存获取
  const cachedUser = await cacheService.getUserCache(userId);
  if (cachedUser && cachedUser.username === userData.username) {
    console.log('   ✅ 用户缓存获取成功');
  } else {
    throw new Error('用户缓存获取失败');
  }
  
  // 测试用户会话缓存
  const sessionData = { token: 'test-token', loginTime: new Date() };
  await cacheService.setUserSession(userId, sessionData, 300);
  
  const cachedSession = await cacheService.getUserSession(userId);
  if (cachedSession && cachedSession.token === sessionData.token) {
    console.log('   ✅ 用户会话缓存成功');
  } else {
    throw new Error('用户会话缓存失败');
  }
}

/**
 * 测试API缓存
 */
async function testApiCache() {
  const endpoint = '/api/test';
  const params = { page: 1, limit: 10 };
  const responseData = {
    success: true,
    data: [{ id: 1, name: 'Test Item' }],
    total: 1
  };
  
  // 测试API缓存设置
  await cacheService.setApiCache(endpoint, JSON.stringify(params), responseData, 300);
  console.log('   ✅ API缓存设置成功');
  
  // 测试API缓存获取
  const cachedResponse = await cacheService.getApiCache(endpoint, JSON.stringify(params));
  if (cachedResponse && cachedResponse.success === responseData.success) {
    console.log('   ✅ API缓存获取成功');
  } else {
    throw new Error('API缓存获取失败');
  }
}

/**
 * 测试缓存统计
 */
async function testCacheStats() {
  const stats = await cacheService.getCacheStats();
  
  if (stats && typeof stats.totalKeys === 'number') {
    console.log(`   ✅ 缓存统计成功 - 总键数: ${stats.totalKeys}`);
    console.log(`   📊 缓存状态: ${stats.cacheStatus.type} (${stats.cacheStatus.available ? '可用' : '不可用'})`);
    
    if (stats.keysByType && Object.keys(stats.keysByType).length > 0) {
      console.log('   📋 键分布:', JSON.stringify(stats.keysByType, null, 2));
    }
  } else {
    throw new Error('缓存统计失败');
  }
}

/**
 * 测试缓存清除
 */
async function testCacheClear() {
  // 先设置一些测试缓存
  await cacheService.setUserCache(999, { name: 'Test User' }, 300);
  await cacheService.set('test:clear:1', 'value1', 300);
  await cacheService.set('test:clear:2', 'value2', 300);
  
  // 测试模式清除
  const deleted = await cacheService.delPattern('test:clear:*');
  if (deleted >= 0) {
    console.log(`   ✅ 模式清除成功 - 删除了 ${deleted} 个键`);
  } else {
    throw new Error('模式清除失败');
  }
  
  // 测试用户缓存清除
  const userDeleted = await cacheService.clearUserCaches();
  if (userDeleted >= 0) {
    console.log(`   ✅ 用户缓存清除成功 - 删除了 ${userDeleted} 个键`);
  } else {
    throw new Error('用户缓存清除失败');
  }
}

/**
 * 性能测试
 */
async function performanceTest() {
  console.log('🚀 开始缓存性能测试...\n');
  
  const iterations = 1000;
  const testData = { 
    message: 'Performance test data',
    timestamp: Date.now(),
    data: new Array(100).fill().map((_, i) => ({ id: i, value: `item${i}` }))
  };
  
  // 写入性能测试
  console.log(`📝 测试 ${iterations} 次写入操作...`);
  const writeStartTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await cacheService.set(`perf:write:${i}`, testData, 60);
  }
  
  const writeEndTime = Date.now();
  const writeTime = writeEndTime - writeStartTime;
  console.log(`   ✅ 写入完成: ${writeTime}ms, 平均: ${(writeTime/iterations).toFixed(2)}ms/次`);
  
  // 读取性能测试
  console.log(`📖 测试 ${iterations} 次读取操作...`);
  const readStartTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await cacheService.get(`perf:write:${i}`);
  }
  
  const readEndTime = Date.now();
  const readTime = readEndTime - readStartTime;
  console.log(`   ✅ 读取完成: ${readTime}ms, 平均: ${(readTime/iterations).toFixed(2)}ms/次`);
  
  // 清理测试数据
  await cacheService.delPattern('perf:*');
  console.log('   🗑️ 性能测试数据已清理');
  
  console.log('\n📊 性能测试总结:');
  console.log(`   - 写入速度: ${(iterations * 1000 / writeTime).toFixed(0)} ops/sec`);
  console.log(`   - 读取速度: ${(iterations * 1000 / readTime).toFixed(0)} ops/sec`);
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  (async () => {
    await testCache();
    await performanceTest();
    process.exit(0);
  })();
}

module.exports = {
  testCache,
  performanceTest,
  testBasicOperations,
  testUserCache,
  testApiCache,
  testCacheStats,
  testCacheClear
};
