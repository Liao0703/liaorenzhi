const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { cacheService } = require('./cacheService');

/**
 * 告警管理器
 * 负责告警规则管理、通知发送、告警历史记录
 */
class AlertManager {
  constructor() {
    this.isInitialized = false;
    this.emailTransporter = null;
    this.alertRules = new Map();
    this.notificationChannels = new Map();
    this.alertHistory = [];
    this.suppressionRules = new Map();
    
    // 默认配置
    this.config = {
      email: {
        enabled: false,
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        },
        from: process.env.SMTP_FROM || 'system@learning-platform.com'
      },
      webhook: {
        enabled: false,
        url: process.env.ALERT_WEBHOOK_URL || '',
        timeout: 5000
      },
      console: {
        enabled: true // 控制台输出始终启用
      }
    };

    this.alertLevels = {
      info: { priority: 1, color: '🔵', name: '信息' },
      warning: { priority: 2, color: '🟡', name: '警告' },
      error: { priority: 3, color: '🔴', name: '错误' },
      critical: { priority: 4, color: '🚨', name: '严重' }
    };
  }

  /**
   * 初始化告警管理器
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('🚨 初始化告警管理器...');

    // 初始化邮件发送器
    if (this.config.email.enabled && this.config.email.host) {
      try {
        this.emailTransporter = nodemailer.createTransporter({
          host: this.config.email.host,
          port: this.config.email.port,
          secure: this.config.email.secure,
          auth: this.config.email.auth
        });

        // 验证邮件配置
        await this.emailTransporter.verify();
        console.log('✅ 邮件告警服务初始化成功');
      } catch (error) {
        console.error('❌ 邮件告警服务初始化失败:', error.message);
        this.config.email.enabled = false;
      }
    }

    // 设置默认告警规则
    this.setupDefaultRules();

    // 启动定时清理任务
    this.startMaintenanceTasks();

    this.isInitialized = true;
    console.log('✅ 告警管理器初始化完成');
  }

  /**
   * 设置默认告警规则
   */
  setupDefaultRules() {
    // CPU使用率告警
    this.addRule('cpu_usage', {
      name: 'CPU使用率监控',
      condition: (metrics) => metrics.system.cpu?.usage > 80,
      severity: 'warning',
      cooldown: 300000, // 5分钟冷却期
      message: (metrics) => `CPU使用率过高: ${metrics.system.cpu?.usage?.toFixed(1)}%`,
      recipients: ['admin@learning-platform.com']
    });

    // 内存使用率告警
    this.addRule('memory_usage', {
      name: '内存使用率监控', 
      condition: (metrics) => metrics.system.memory?.usage > 85,
      severity: 'warning',
      cooldown: 300000,
      message: (metrics) => `内存使用率过高: ${metrics.system.memory?.usage?.toFixed(1)}%`,
      recipients: ['admin@learning-platform.com']
    });

    // 磁盘空间告警
    this.addRule('disk_usage', {
      name: '磁盘空间监控',
      condition: (metrics) => metrics.system.disk?.usage > 90,
      severity: 'error',
      cooldown: 600000, // 10分钟冷却期
      message: (metrics) => `磁盘空间不足: ${metrics.system.disk?.usage?.toFixed(1)}%`,
      recipients: ['admin@learning-platform.com']
    });

    // 数据库连接告警
    this.addRule('database_status', {
      name: '数据库状态监控',
      condition: (metrics) => metrics.database.status === 'error',
      severity: 'critical',
      cooldown: 60000, // 1分钟冷却期
      message: () => '数据库连接异常，请立即检查',
      recipients: ['admin@learning-platform.com', 'dba@learning-platform.com']
    });

    // 响应时间告警
    this.addRule('response_time', {
      name: 'API响应时间监控',
      condition: (metrics) => metrics.application.avgResponseTime > 2000,
      severity: 'warning',
      cooldown: 300000,
      message: (metrics) => `API响应时间过长: ${metrics.application.avgResponseTime?.toFixed(0)}ms`,
      recipients: ['dev@learning-platform.com']
    });

    // 错误率告警
    this.addRule('error_rate', {
      name: 'API错误率监控',
      condition: (metrics) => metrics.application.errorRate > 5,
      severity: 'error',
      cooldown: 180000, // 3分钟冷却期
      message: (metrics) => `API错误率过高: ${metrics.application.errorRate?.toFixed(1)}%`,
      recipients: ['dev@learning-platform.com']
    });

    console.log(`📋 已设置 ${this.alertRules.size} 个默认告警规则`);
  }

  /**
   * 添加告警规则
   */
  addRule(id, rule) {
    const defaultRule = {
      enabled: true,
      cooldown: 300000, // 默认5分钟冷却期
      severity: 'warning',
      recipients: [],
      channels: ['console', 'email'],
      ...rule
    };

    this.alertRules.set(id, defaultRule);
    console.log(`📌 添加告警规则: ${id} - ${rule.name}`);
  }

  /**
   * 删除告警规则
   */
  removeRule(id) {
    if (this.alertRules.delete(id)) {
      console.log(`🗑️ 删除告警规则: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * 处理监控指标，检查告警条件
   */
  async processMetrics(metrics) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const triggeredAlerts = [];
    const now = Date.now();

    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        // 检查是否在冷却期内
        const suppressionKey = `alert_suppression:${ruleId}`;
        const lastAlert = await cacheService.get(suppressionKey);
        
        if (lastAlert && (now - lastAlert) < rule.cooldown) {
          continue; // 在冷却期内，跳过
        }

        // 评估告警条件
        if (rule.condition(metrics)) {
          const alert = {
            id: `${ruleId}-${now}`,
            ruleId,
            ruleName: rule.name,
            severity: rule.severity,
            message: typeof rule.message === 'function' ? rule.message(metrics) : rule.message,
            timestamp: now,
            metrics: this.extractRelevantMetrics(metrics, ruleId)
          };

          triggeredAlerts.push(alert);

          // 设置冷却期
          await cacheService.set(suppressionKey, now, rule.cooldown / 1000);

          // 发送通知
          await this.sendNotification(alert, rule);

          // 记录告警历史
          this.recordAlert(alert);
        }
      } catch (error) {
        console.error(`❌ 告警规则处理失败 [${ruleId}]:`, error.message);
      }
    }

    return triggeredAlerts;
  }

  /**
   * 发送通知
   */
  async sendNotification(alert, rule) {
    const notifications = [];

    // 控制台通知
    if (rule.channels.includes('console')) {
      notifications.push(this.sendConsoleNotification(alert));
    }

    // 邮件通知
    if (rule.channels.includes('email') && this.config.email.enabled) {
      notifications.push(this.sendEmailNotification(alert, rule.recipients));
    }

    // Webhook通知
    if (rule.channels.includes('webhook') && this.config.webhook.enabled) {
      notifications.push(this.sendWebhookNotification(alert));
    }

    try {
      await Promise.all(notifications);
    } catch (error) {
      console.error('❌ 通知发送失败:', error.message);
    }
  }

  /**
   * 控制台通知
   */
  async sendConsoleNotification(alert) {
    const level = this.alertLevels[alert.severity];
    const timestamp = new Date(alert.timestamp).toLocaleString('zh-CN');
    
    console.log(`${level.color} 【${level.name}告警】 ${alert.message}`);
    console.log(`   规则: ${alert.ruleName}`);
    console.log(`   时间: ${timestamp}`);
    console.log(`   ID: ${alert.id}`);
    
    return Promise.resolve();
  }

  /**
   * 邮件通知
   */
  async sendEmailNotification(alert, recipients) {
    if (!this.emailTransporter || recipients.length === 0) {
      return;
    }

    const level = this.alertLevels[alert.severity];
    const timestamp = new Date(alert.timestamp).toLocaleString('zh-CN');

    const mailOptions = {
      from: this.config.email.from,
      to: recipients.join(', '),
      subject: `${level.name}告警 - ${alert.ruleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
            <h2 style="margin: 0;">${level.color} ${level.name}告警</h2>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h3 style="color: #333; margin-top: 0;">${alert.ruleName}</h3>
            <p style="font-size: 16px; color: #666; line-height: 1.5;">
              <strong>告警消息:</strong><br>
              ${alert.message}
            </p>
            
            <div style="margin: 20px 0;">
              <strong>告警详情:</strong><br>
              <ul style="color: #666;">
                <li>告警ID: ${alert.id}</li>
                <li>严重程度: ${level.name}</li>
                <li>触发时间: ${timestamp}</li>
                <li>规则名称: ${alert.ruleName}</li>
              </ul>
            </div>

            ${alert.metrics ? `
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>相关指标:</strong><br>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto;">
${JSON.stringify(alert.metrics, null, 2)}
              </pre>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
              此邮件由铁路学习平台监控系统自动发送，请勿回复。
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log(`📧 告警邮件已发送给: ${recipients.join(', ')}`);
    } catch (error) {
      console.error('❌ 告警邮件发送失败:', error.message);
    }
  }

  /**
   * Webhook通知
   */
  async sendWebhookNotification(alert) {
    if (!this.config.webhook.url) return;

    const payload = {
      alert_id: alert.id,
      rule_name: alert.ruleName,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      metrics: alert.metrics
    };

    try {
      const response = await fetch(this.config.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        timeout: this.config.webhook.timeout
      });

      if (response.ok) {
        console.log('🔗 Webhook告警通知发送成功');
      } else {
        console.error('❌ Webhook告警通知发送失败:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Webhook告警通知发送失败:', error.message);
    }
  }

  /**
   * 记录告警历史
   */
  recordAlert(alert) {
    // 添加到内存历史
    this.alertHistory.unshift(alert);
    
    // 保留最近1000条记录
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(0, 1000);
    }

    // 缓存告警历史
    cacheService.set('alert_history', this.alertHistory.slice(0, 100), 3600)
      .catch(error => console.error('缓存告警历史失败:', error.message));
  }

  /**
   * 获取告警历史
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * 获取活跃告警
   */
  async getActiveAlerts() {
    try {
      const activeAlerts = await cacheService.get('monitoring:alerts') || [];
      return activeAlerts.filter(alert => 
        Date.now() - alert.timestamp < 3600000 // 最近1小时的告警
      );
    } catch (error) {
      console.error('获取活跃告警失败:', error.message);
      return [];
    }
  }

  /**
   * 提取相关指标
   */
  extractRelevantMetrics(metrics, ruleId) {
    switch (ruleId) {
      case 'cpu_usage':
        return { cpu: metrics.system.cpu };
      case 'memory_usage':
        return { memory: metrics.system.memory };
      case 'disk_usage':
        return { disk: metrics.system.disk };
      case 'database_status':
        return { database: metrics.database };
      case 'response_time':
      case 'error_rate':
        return { application: metrics.application };
      default:
        return null;
    }
  }

  /**
   * 获取严重程度颜色
   */
  getSeverityColor(severity) {
    const colors = {
      info: '#17a2b8',
      warning: '#ffc107', 
      error: '#dc3545',
      critical: '#6f42c1'
    };
    return colors[severity] || '#6c757d';
  }

  /**
   * 启动维护任务
   */
  startMaintenanceTasks() {
    // 每天清理过期的告警历史
    cron.schedule('0 2 * * *', () => {
      this.cleanupExpiredAlerts();
    });

    console.log('🔧 告警维护任务已启动');
  }

  /**
   * 清理过期告警
   */
  cleanupExpiredAlerts() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const beforeCount = this.alertHistory.length;
    
    this.alertHistory = this.alertHistory.filter(alert => 
      alert.timestamp > oneWeekAgo
    );
    
    const cleaned = beforeCount - this.alertHistory.length;
    if (cleaned > 0) {
      console.log(`🗑️ 清理了 ${cleaned} 条过期告警记录`);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ 告警管理器配置已更新');
  }

  /**
   * 获取告警统计
   */
  getStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);

    const recent24h = this.alertHistory.filter(alert => alert.timestamp > last24h);
    const recent7d = this.alertHistory.filter(alert => alert.timestamp > last7d);

    const severityCount = {};
    for (const severity of Object.keys(this.alertLevels)) {
      severityCount[severity] = recent24h.filter(alert => alert.severity === severity).length;
    }

    return {
      total: this.alertHistory.length,
      last24h: recent24h.length,
      last7d: recent7d.length,
      severityCount,
      rules: this.alertRules.size,
      enabled: this.isInitialized
    };
  }
}

// 创建告警管理器单例
const alertManager = new AlertManager();

module.exports = {
  AlertManager,
  alertManager
};
