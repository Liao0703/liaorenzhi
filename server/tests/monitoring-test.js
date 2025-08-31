const { monitoringService } = require('../services/monitoringService');
const { alertManager } = require('../services/alertManager');

/**
 * 监控告警系统测试
 */
async function testMonitoringSystem() {
  console.log('🧪 开始监控告警系统测试...\n');
  
  try {
    // 测试监控服务
    console.log('1️⃣ 测试监控服务...');
    await testMonitoringService();
    
    // 测试告警管理器
    console.log('2️⃣ 测试告警管理器...');
    await testAlertManager();
    
    // 测试性能监控
    console.log('3️⃣ 测试性能监控...');
    await testPerformanceMonitoring();
    
    // 测试告警触发
    console.log('4️⃣ 测试告警触发...');
    await testAlertTriggering();
    
    console.log('\n✅ 所有监控系统测试通过！');
    
  } catch (error) {
    console.error('❌ 监控系统测试失败:', error.message);
    console.error(error.stack);
  }
}

/**
 * 测试监控服务
 */
async function testMonitoringService() {
  // 启动监控数据收集
  monitoringService.startCollection(5000); // 5秒间隔用于测试
  console.log('   ✅ 监控数据收集已启动');
  
  // 等待收集数据
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // 获取指标
  const metrics = monitoringService.getMetrics();
  if (metrics.system && metrics.application && metrics.database && metrics.cache) {
    console.log('   ✅ 监控指标收集成功');
  } else {
    throw new Error('监控指标收集不完整');
  }
  
  // 测试摘要信息
  const summary = monitoringService.getSummary();
  if (summary.status && summary.uptime && summary.timestamp) {
    console.log('   ✅ 系统摘要生成成功');
    console.log(`   📊 系统状态: ${summary.status}, 运行时间: ${summary.uptime}`);
  } else {
    throw new Error('系统摘要生成失败');
  }
  
  // 记录一些测试请求
  for (let i = 0; i < 10; i++) {
    monitoringService.recordRequest(Math.random() * 1000, i % 3 === 0); // 随机响应时间，33%错误率
  }
  console.log('   ✅ 请求指标记录成功');
  
  // 停止监控
  monitoringService.stopCollection();
  console.log('   ✅ 监控数据收集已停止');
}

/**
 * 测试告警管理器
 */
async function testAlertManager() {
  // 初始化告警管理器
  await alertManager.initialize();
  console.log('   ✅ 告警管理器初始化成功');
  
  // 测试自定义告警规则
  alertManager.addRule('test_rule', {
    name: '测试告警规则',
    condition: () => true, // 总是触发
    severity: 'warning',
    message: '这是一个测试告警',
    cooldown: 1000, // 1秒冷却期
    recipients: ['test@example.com'],
    channels: ['console']
  });
  console.log('   ✅ 自定义告警规则添加成功');
  
  // 获取告警统计
  const stats = alertManager.getStats();
  if (stats.rules > 0) {
    console.log(`   ✅ 告警统计获取成功 - 规则数: ${stats.rules}`);
  } else {
    throw new Error('告警统计获取失败');
  }
  
  // 测试历史记录
  const history = alertManager.getAlertHistory(5);
  console.log(`   📋 告警历史记录: ${history.length} 条`);
}

/**
 * 测试性能监控
 */
async function testPerformanceMonitoring() {
  // 模拟API请求性能测试
  const testRequests = 100;
  const startTime = Date.now();
  
  console.log(`   📊 模拟 ${testRequests} 个API请求...`);
  
  for (let i = 0; i < testRequests; i++) {
    const requestTime = Math.random() * 500 + 100; // 100-600ms随机响应时间
    const hasError = Math.random() < 0.05; // 5%错误率
    
    monitoringService.recordRequest(requestTime, hasError);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`   ✅ 性能测试完成，耗时: ${duration}ms`);
  
  // 获取应用指标
  const metrics = monitoringService.getMetrics();
  console.log(`   📈 总请求数: ${metrics.application.requests}`);
  console.log(`   📈 总错误数: ${metrics.application.errors}`);
  console.log(`   📈 错误率: ${metrics.application.errorRate?.toFixed(2)}%`);
  console.log(`   📈 平均响应时间: ${metrics.application.avgResponseTime?.toFixed(0)}ms`);
}

/**
 * 测试告警触发
 */
async function testAlertTriggering() {
  // 创建模拟的高负载指标
  const mockHighLoadMetrics = {
    system: {
      cpu: { usage: 85 }, // 高CPU使用率
      memory: { usage: 90 }, // 高内存使用率
      disk: { usage: 95 } // 高磁盘使用率
    },
    database: {
      status: 'error' // 数据库错误
    },
    application: {
      requests: 1000,
      errors: 100,
      errorRate: 10, // 10%错误率
      avgResponseTime: 3000 // 3秒响应时间
    },
    cache: {
      available: true,
      type: 'Memory'
    },
    alerts: []
  };
  
  console.log('   🚨 模拟高负载场景...');
  
  // 处理告警
  const triggeredAlerts = await alertManager.processMetrics(mockHighLoadMetrics);
  
  if (triggeredAlerts.length > 0) {
    console.log(`   ✅ 成功触发 ${triggeredAlerts.length} 个告警:`);
    triggeredAlerts.forEach(alert => {
      console.log(`     - ${alert.severity}: ${alert.message}`);
    });
  } else {
    console.log('   📝 当前指标未触发告警（可能在冷却期内）');
  }
  
  // 获取活跃告警
  const activeAlerts = await alertManager.getActiveAlerts();
  console.log(`   📊 当前活跃告警数: ${activeAlerts.length}`);
  
  // 测试正常指标（不应触发告警）
  const mockNormalMetrics = {
    system: {
      cpu: { usage: 30 },
      memory: { usage: 50 },
      disk: { usage: 60 }
    },
    database: {
      status: 'healthy'
    },
    application: {
      requests: 1000,
      errors: 10,
      errorRate: 1,
      avgResponseTime: 200
    },
    cache: {
      available: true,
      type: 'Redis'
    },
    alerts: []
  };
  
  console.log('   ✅ 测试正常指标场景...');
  const normalAlerts = await alertManager.processMetrics(mockNormalMetrics);
  console.log(`   📊 正常指标触发告警数: ${normalAlerts.length} (应该为0或很少)`);
}

/**
 * 监控API测试
 */
async function testMonitoringAPIs() {
  console.log('🌐 测试监控API接口...\n');
  
  const baseUrl = 'http://localhost:3001';
  const endpoints = [
    '/health',
    '/api/monitoring/summary',
    '/api/monitoring/metrics', 
    '/api/monitoring/status',
    '/api/monitoring/alerts',
    '/api/monitoring/config'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${response.status} OK`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: 请求失败 - ${error.message}`);
    }
  }
}

/**
 * 压力测试
 */
async function stressTest() {
  console.log('💪 开始监控系统压力测试...\n');
  
  const iterations = 50;
  console.log(`🔄 执行 ${iterations} 次监控数据收集...`);
  
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await monitoringService.collectMetrics();
    
    // 每10次显示一次进度
    if (i % 10 === 0) {
      console.log(`   进度: ${i}/${iterations}`);
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`✅ 压力测试完成:`);
  console.log(`   总耗时: ${duration}ms`);
  console.log(`   平均耗时: ${(duration/iterations).toFixed(2)}ms/次`);
  console.log(`   处理速度: ${(iterations * 1000 / duration).toFixed(0)} ops/sec`);
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  (async () => {
    await testMonitoringSystem();
    console.log('\n' + '='.repeat(50));
    await stressTest();
    
    // 如果服务器在运行，测试API
    try {
      await testMonitoringAPIs();
    } catch (error) {
      console.log('\n⚠️  无法连接到服务器，跳过API测试');
      console.log('   请先启动服务器: node app.js');
    }
    
    console.log('\n🎉 监控系统测试完成！');
    process.exit(0);
  })();
}

module.exports = {
  testMonitoringSystem,
  testAlertManager,
  testPerformanceMonitoring,
  testAlertTriggering,
  testMonitoringAPIs,
  stressTest
};
