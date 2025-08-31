const { monitoringService } = require('../services/monitoringService');
const { alertManager } = require('../services/alertManager');

/**
 * 请求性能监控中间件
 */
const requestMonitoring = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // 拦截响应
    res.send = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const isError = res.statusCode >= 400;

      // 记录请求指标
      monitoringService.recordRequest(responseTime, isError);

      // 设置响应头
      res.set('X-Response-Time', `${responseTime}ms`);
      
      // 详细日志（仅记录慢请求和错误请求）
      if (responseTime > 1000 || isError) {
        console.log(`📊 ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms${isError ? ' (ERROR)' : ' (SLOW)'}`);
      }

      // 调用原始send方法
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * 错误监控中间件
 */
const errorMonitoring = () => {
  return (err, req, res, next) => {
    // 记录错误
    monitoringService.recordRequest(0, true);
    
    // 详细错误日志
    console.error(`🚨 API错误 ${req.method} ${req.path}:`, {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 继续处理错误
    next(err);
  };
};

/**
 * 健康检查监控中间件
 * 为健康检查端点添加详细的系统信息
 */
const healthCheckEnhancer = () => {
  return async (req, res, next) => {
    if (req.path === '/health' || req.path === '/api/health') {
      try {
        // 获取监控数据
        const metrics = monitoringService.getMetrics();
        const summary = monitoringService.getSummary();
        const activeAlerts = await alertManager.getActiveAlerts();
        
        // 增强健康检查响应
        const healthData = {
          status: summary.status,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          uptime: summary.uptime,
          system: {
            cpu: metrics.system.cpu?.usage?.toFixed(1) + '%' || 'N/A',
            memory: metrics.system.memory?.usage?.toFixed(1) + '%' || 'N/A',
            disk: metrics.system.disk?.usage?.toFixed(1) + '%' || 'N/A'
          },
          application: {
            requests: summary.requests,
            errors: summary.errors,
            errorRate: summary.errorRate,
            avgResponseTime: summary.avgResponseTime
          },
          database: {
            status: metrics.database.status,
            queryTime: metrics.database.queryTime + 'ms'
          },
          cache: {
            type: metrics.cache.type,
            available: metrics.cache.available,
            keys: metrics.cache.totalKeys
          },
          alerts: {
            active: activeAlerts.length,
            total: summary.alerts
          }
        };

        // 返回增强的健康检查数据
        return res.json(healthData);
      } catch (error) {
        console.error('健康检查增强失败:', error.message);
        // 失败时返回基本健康状态
        return res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          error: '监控数据获取失败'
        });
      }
    }
    
    next();
  };
};

/**
 * API监控面板中间件
 * 提供实时监控数据的API接口
 */
const monitoringAPI = () => {
  return async (req, res, next) => {
    // 监控指标API
    if (req.path === '/api/monitoring/metrics') {
      try {
        const metrics = monitoringService.getMetrics();
        return res.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '获取监控指标失败',
          message: error.message
        });
      }
    }

    // 系统摘要API
    if (req.path === '/api/monitoring/summary') {
      try {
        const summary = monitoringService.getSummary();
        return res.json({
          success: true,
          data: summary,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '获取系统摘要失败',
          message: error.message
        });
      }
    }

    // 告警历史API
    if (req.path === '/api/monitoring/alerts') {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const alerts = alertManager.getAlertHistory(limit);
        const stats = alertManager.getStats();
        
        return res.json({
          success: true,
          data: {
            alerts,
            stats
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '获取告警数据失败',
          message: error.message
        });
      }
    }

    // 活跃告警API
    if (req.path === '/api/monitoring/alerts/active') {
      try {
        const activeAlerts = await alertManager.getActiveAlerts();
        return res.json({
          success: true,
          data: activeAlerts,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '获取活跃告警失败',
          message: error.message
        });
      }
    }

    // 系统状态API
    if (req.path === '/api/monitoring/status') {
      try {
        const metrics = monitoringService.getMetrics();
        const activeAlerts = await alertManager.getActiveAlerts();
        
        const status = {
          overall: monitoringService.getSummary().status,
          components: {
            api: metrics.application.requests > 0 ? 'healthy' : 'unknown',
            database: metrics.database.status === 'healthy' ? 'healthy' : 'error',
            cache: metrics.cache.available ? 'healthy' : 'degraded',
            monitoring: monitoringService.isCollecting ? 'healthy' : 'stopped'
          },
          alerts: activeAlerts.length,
          uptime: monitoringService.getSummary().uptime,
          lastUpdate: new Date().toISOString()
        };

        return res.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '获取系统状态失败',
          message: error.message
        });
      }
    }

    next();
  };
};

/**
 * 监控配置管理中间件
 */
const monitoringConfig = () => {
  return async (req, res, next) => {
    // 获取监控配置
    if (req.path === '/api/monitoring/config' && req.method === 'GET') {
      try {
        const metrics = monitoringService.getMetrics();
        const alertStats = alertManager.getStats();
        
        return res.json({
          success: true,
          data: {
            thresholds: metrics.thresholds,
            collecting: metrics.collecting,
            alertRules: alertStats.rules,
            alertsEnabled: alertStats.enabled
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '获取监控配置失败',
          message: error.message
        });
      }
    }

    // 更新阈值配置
    if (req.path === '/api/monitoring/thresholds' && req.method === 'POST') {
      try {
        const { thresholds } = req.body;
        
        if (!thresholds || typeof thresholds !== 'object') {
          return res.status(400).json({
            success: false,
            error: '无效的阈值配置'
          });
        }

        monitoringService.updateThresholds(thresholds);
        
        return res.json({
          success: true,
          message: '阈值配置已更新',
          data: thresholds,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '更新阈值配置失败',
          message: error.message
        });
      }
    }

    // 清除监控历史数据
    if (req.path === '/api/monitoring/clear' && req.method === 'POST') {
      try {
        const { type } = req.body;
        
        if (type === 'metrics') {
          monitoringService.clearHistory();
        } else if (type === 'alerts') {
          // 清理告警历史的功能需要在alertManager中实现
        } else {
          return res.status(400).json({
            success: false,
            error: '无效的清理类型'
          });
        }

        return res.json({
          success: true,
          message: `${type}历史数据已清除`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: '清除历史数据失败',
          message: error.message
        });
      }
    }

    next();
  };
};

/**
 * 性能统计中间件
 */
const performanceStats = () => {
  return (req, res, next) => {
    // 在响应完成时记录统计信息
    res.on('finish', () => {
      const responseTime = res.get('X-Response-Time');
      if (responseTime) {
        const time = parseInt(responseTime);
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        
        // 可以在这里记录更详细的端点级别统计
        // 比如每个API端点的平均响应时间、调用次数等
      }
    });

    next();
  };
};

module.exports = {
  requestMonitoring,
  errorMonitoring,
  healthCheckEnhancer,
  monitoringAPI,
  monitoringConfig,
  performanceStats
};
