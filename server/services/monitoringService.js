const si = require('systeminformation');
const { cacheService } = require('./cacheService');
const { pool } = require('../config/database');

/**
 * 系统监控服务
 * 负责收集系统指标、应用性能数据、数据库状态等
 */
class MonitoringService {
  constructor() {
    this.metrics = {
      system: {},
      application: {
        startTime: Date.now(),
        requests: 0,
        errors: 0,
        responseTime: [],
        uptime: 0
      },
      database: {},
      cache: {},
      alerts: []
    };

    // 性能阈值配置
    this.thresholds = {
      cpu: 80,           // CPU使用率 %
      memory: 85,        // 内存使用率 %
      disk: 90,          // 磁盘使用率 %
      responseTime: 2000, // 响应时间 ms
      errorRate: 5,      // 错误率 %
      dbConnections: 50  // 数据库连接数
    };

    this.isCollecting = false;
    this.collectionInterval = null;
  }

  /**
   * 启动监控数据收集
   */
  startCollection(interval = 60000) { // 默认1分钟
    if (this.isCollecting) {
      console.log('📊 监控数据收集已在运行中');
      return;
    }

    console.log('🚀 启动系统监控数据收集...');
    this.isCollecting = true;

    // 立即收集一次
    this.collectMetrics();

    // 定期收集
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);

    console.log(`✅ 监控数据收集已启动，间隔: ${interval/1000}秒`);
  }

  /**
   * 停止监控数据收集
   */
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isCollecting = false;
    console.log('⏹️ 监控数据收集已停止');
  }

  /**
   * 收集所有监控指标
   */
  async collectMetrics() {
    try {
      console.log('📊 收集监控数据...');
      
      // 并行收集各类指标
      const [systemMetrics, dbMetrics, cacheMetrics] = await Promise.all([
        this.collectSystemMetrics(),
        this.collectDatabaseMetrics(),
        this.collectCacheMetrics()
      ]);

      // 更新应用指标
      this.updateApplicationMetrics();

      // 缓存监控数据
      await this.cacheMetrics();

      // 检查告警
      await this.checkAlerts();

      console.log('✅ 监控数据收集完成');

    } catch (error) {
      console.error('❌ 监控数据收集失败:', error.message);
    }
  }

  /**
   * 收集系统指标
   */
  async collectSystemMetrics() {
    try {
      const [cpu, mem, disk, network, load] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.currentLoad()
      ]);

      this.metrics.system = {
        cpu: {
          usage: cpu.currentLoad || 0,
          cores: cpu.cpus?.length || 0,
          speed: cpu.avgLoad || 0
        },
        memory: {
          total: mem.total || 0,
          free: mem.free || 0,
          used: mem.used || 0,
          usage: mem.total ? ((mem.used / mem.total) * 100) : 0
        },
        disk: disk.length > 0 ? {
          total: disk[0].size || 0,
          free: disk[0].available || 0,
          used: disk[0].used || 0,
          usage: disk[0].size ? ((disk[0].used / disk[0].size) * 100) : 0
        } : {},
        network: network.length > 0 ? {
          rx: network[0].rx_sec || 0,
          tx: network[0].tx_sec || 0
        } : {},
        load: {
          current: load.currentLoad || 0,
          avg: load.avgLoad || 0
        },
        timestamp: Date.now()
      };

      return this.metrics.system;
    } catch (error) {
      console.error('❌ 系统指标收集失败:', error.message);
      return {};
    }
  }

  /**
   * 收集数据库指标
   */
  async collectDatabaseMetrics() {
    try {
      let dbStatus = 'unknown';
      let connectionCount = 0;
      let queryTime = 0;

      const startTime = Date.now();
      
      try {
        // 测试数据库连接和查询性能
        await pool.execute('SELECT 1 as test');
        queryTime = Date.now() - startTime;
        dbStatus = 'healthy';
        
        // 获取连接池信息
        if (pool.pool) {
          connectionCount = pool.pool.numUsedConnections || 0;
        }
      } catch (error) {
        dbStatus = 'error';
        console.error('数据库健康检查失败:', error.message);
      }

      this.metrics.database = {
        status: dbStatus,
        connectionCount,
        queryTime,
        lastCheck: Date.now()
      };

      return this.metrics.database;
    } catch (error) {
      console.error('❌ 数据库指标收集失败:', error.message);
      return {};
    }
  }

  /**
   * 收集缓存指标
   */
  async collectCacheMetrics() {
    try {
      const cacheHealth = await cacheService.healthCheck();
      const cacheStats = await cacheService.getCacheStats();

      this.metrics.cache = {
        status: cacheHealth.status,
        type: cacheStats.cacheStatus?.type || 'unknown',
        available: cacheStats.cacheStatus?.available || false,
        totalKeys: cacheStats.totalKeys || 0,
        keysByType: cacheStats.keysByType || {},
        lastCheck: Date.now()
      };

      return this.metrics.cache;
    } catch (error) {
      console.error('❌ 缓存指标收集失败:', error.message);
      return {};
    }
  }

  /**
   * 更新应用指标
   */
  updateApplicationMetrics() {
    this.metrics.application.uptime = Date.now() - this.metrics.application.startTime;
    
    // 计算平均响应时间
    if (this.metrics.application.responseTime.length > 0) {
      const avgResponseTime = this.metrics.application.responseTime.reduce((a, b) => a + b, 0) 
        / this.metrics.application.responseTime.length;
      this.metrics.application.avgResponseTime = avgResponseTime;
    }

    // 计算错误率
    if (this.metrics.application.requests > 0) {
      this.metrics.application.errorRate = 
        (this.metrics.application.errors / this.metrics.application.requests) * 100;
    }

    // 清理旧的响应时间数据（保留最近1000条）
    if (this.metrics.application.responseTime.length > 1000) {
      this.metrics.application.responseTime = 
        this.metrics.application.responseTime.slice(-1000);
    }
  }

  /**
   * 缓存监控数据
   */
  async cacheMetrics() {
    try {
      await cacheService.set('monitoring:metrics', this.metrics, 300); // 缓存5分钟
      await cacheService.set('monitoring:timestamp', Date.now(), 300);
    } catch (error) {
      console.error('❌ 缓存监控数据失败:', error.message);
    }
  }

  /**
   * 检查告警条件
   */
  async checkAlerts() {
    const alerts = [];
    const now = Date.now();

    // 检查CPU使用率
    if (this.metrics.system.cpu?.usage > this.thresholds.cpu) {
      alerts.push({
        type: 'cpu_high',
        severity: 'warning',
        message: `CPU使用率过高: ${this.metrics.system.cpu.usage.toFixed(1)}%`,
        value: this.metrics.system.cpu.usage,
        threshold: this.thresholds.cpu,
        timestamp: now
      });
    }

    // 检查内存使用率
    if (this.metrics.system.memory?.usage > this.thresholds.memory) {
      alerts.push({
        type: 'memory_high',
        severity: 'warning',
        message: `内存使用率过高: ${this.metrics.system.memory.usage.toFixed(1)}%`,
        value: this.metrics.system.memory.usage,
        threshold: this.thresholds.memory,
        timestamp: now
      });
    }

    // 检查磁盘使用率
    if (this.metrics.system.disk?.usage > this.thresholds.disk) {
      alerts.push({
        type: 'disk_high',
        severity: 'error',
        message: `磁盘使用率过高: ${this.metrics.system.disk.usage.toFixed(1)}%`,
        value: this.metrics.system.disk.usage,
        threshold: this.thresholds.disk,
        timestamp: now
      });
    }

    // 检查数据库状态
    if (this.metrics.database.status === 'error') {
      alerts.push({
        type: 'database_error',
        severity: 'critical',
        message: '数据库连接异常',
        timestamp: now
      });
    }

    // 检查响应时间
    if (this.metrics.application.avgResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'response_time_high',
        severity: 'warning',
        message: `平均响应时间过长: ${this.metrics.application.avgResponseTime}ms`,
        value: this.metrics.application.avgResponseTime,
        threshold: this.thresholds.responseTime,
        timestamp: now
      });
    }

    // 检查错误率
    if (this.metrics.application.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate_high',
        severity: 'error',
        message: `错误率过高: ${this.metrics.application.errorRate.toFixed(1)}%`,
        value: this.metrics.application.errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: now
      });
    }

    // 更新告警列表
    if (alerts.length > 0) {
      this.metrics.alerts = [...alerts, ...this.metrics.alerts.slice(0, 50)]; // 保留最近50条
      console.log(`⚠️ 发现 ${alerts.length} 个告警`);
      
      // 缓存告警数据
      await cacheService.set('monitoring:alerts', alerts, 600);
    }

    return alerts;
  }

  /**
   * 记录请求指标
   */
  recordRequest(responseTime, isError = false) {
    this.metrics.application.requests++;
    this.metrics.application.responseTime.push(responseTime);
    
    if (isError) {
      this.metrics.application.errors++;
    }
  }

  /**
   * 获取当前指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      collecting: this.isCollecting,
      thresholds: this.thresholds
    };
  }

  /**
   * 获取系统摘要
   */
  getSummary() {
    const uptime = this.metrics.application.uptime;
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));

    return {
      status: this.getOverallStatus(),
      uptime: `${days}天 ${hours}小时 ${minutes}分钟`,
      requests: this.metrics.application.requests,
      errors: this.metrics.application.errors,
      errorRate: this.metrics.application.errorRate?.toFixed(2) + '%' || '0%',
      avgResponseTime: this.metrics.application.avgResponseTime?.toFixed(0) + 'ms' || 'N/A',
      alerts: this.metrics.alerts.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取整体状态
   */
  getOverallStatus() {
    if (this.metrics.alerts.some(alert => alert.severity === 'critical')) {
      return 'critical';
    }
    if (this.metrics.alerts.some(alert => alert.severity === 'error')) {
      return 'error';
    }
    if (this.metrics.alerts.some(alert => alert.severity === 'warning')) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * 更新阈值配置
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('📊 阈值配置已更新:', this.thresholds);
  }

  /**
   * 清除历史数据
   */
  clearHistory() {
    this.metrics.application.responseTime = [];
    this.metrics.alerts = [];
    console.log('🗑️ 监控历史数据已清除');
  }
}

// 创建监控服务单例
const monitoringService = new MonitoringService();

module.exports = {
  MonitoringService,
  monitoringService
};
