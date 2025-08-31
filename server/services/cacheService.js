const { cacheClient } = require('../config/redis');

/**
 * 缓存服务类 - 提供高级缓存功能
 */
class CacheService {
  constructor() {
    this.defaultTTL = 300; // 默认5分钟过期
    this.keyPrefix = 'learning_platform:'; // 键前缀
  }

  /**
   * 生成缓存键
   */
  generateKey(...parts) {
    return this.keyPrefix + parts.join(':');
  }

  /**
   * 设置缓存
   */
  async set(key, data, ttl = this.defaultTTL) {
    try {
      const fullKey = this.generateKey(key);
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      
      const result = await cacheClient.set(fullKey, value, { EX: ttl });
      console.log(`✅ 缓存已设置: ${fullKey} (TTL: ${ttl}s)`);
      return result;
    } catch (error) {
      console.error('❌ 设置缓存失败:', error.message);
      return null;
    }
  }

  /**
   * 获取缓存
   */
  async get(key) {
    try {
      const fullKey = this.generateKey(key);
      const value = await cacheClient.get(fullKey);
      
      if (!value) {
        console.log(`📭 缓存未命中: ${fullKey}`);
        return null;
      }

      console.log(`✅ 缓存命中: ${fullKey}`);
      
      // 尝试解析JSON
      try {
        return JSON.parse(value);
      } catch {
        return value; // 如果不是JSON，返回原始字符串
      }
    } catch (error) {
      console.error('❌ 获取缓存失败:', error.message);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async del(key) {
    try {
      const fullKey = this.generateKey(key);
      const result = await cacheClient.del(fullKey);
      console.log(`🗑️ 缓存已删除: ${fullKey}`);
      return result;
    } catch (error) {
      console.error('❌ 删除缓存失败:', error.message);
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key) {
    try {
      const fullKey = this.generateKey(key);
      return await cacheClient.exists(fullKey);
    } catch (error) {
      console.error('❌ 检查缓存失败:', error.message);
      return 0;
    }
  }

  /**
   * 批量删除缓存（按模式）
   */
  async delPattern(pattern) {
    try {
      const fullPattern = this.generateKey(pattern);
      const keys = await cacheClient.keys(fullPattern);
      
      if (keys.length === 0) {
        console.log(`📭 未找到匹配的缓存键: ${fullPattern}`);
        return 0;
      }

      let deletedCount = 0;
      for (const key of keys) {
        const result = await cacheClient.del(key);
        deletedCount += result;
      }

      console.log(`🗑️ 批量删除缓存: ${deletedCount} 个键`);
      return deletedCount;
    } catch (error) {
      console.error('❌ 批量删除缓存失败:', error.message);
      return 0;
    }
  }

  // === 业务特定缓存方法 ===

  /**
   * 用户信息缓存
   */
  async getUserCache(userId) {
    return await this.get(`user:${userId}`);
  }

  async setUserCache(userId, userData, ttl = 600) { // 用户信息缓存10分钟
    return await this.set(`user:${userId}`, userData, ttl);
  }

  async delUserCache(userId) {
    return await this.del(`user:${userId}`);
  }

  /**
   * 用户列表缓存
   */
  async getUsersListCache() {
    return await this.get('users:list');
  }

  async setUsersListCache(usersData, ttl = 300) { // 用户列表缓存5分钟
    return await this.set('users:list', usersData, ttl);
  }

  async delUsersListCache() {
    return await this.del('users:list');
  }

  /**
   * 用户会话缓存
   */
  async getUserSession(userId) {
    return await this.get(`session:${userId}`);
  }

  async setUserSession(userId, sessionData, ttl = 3600) { // 会话缓存1小时
    return await this.set(`session:${userId}`, sessionData, ttl);
  }

  async delUserSession(userId) {
    return await this.del(`session:${userId}`);
  }

  /**
   * API响应缓存
   */
  async getApiCache(endpoint, params = '') {
    const cacheKey = `api:${endpoint}:${this.hashParams(params)}`;
    return await this.get(cacheKey);
  }

  async setApiCache(endpoint, params = '', responseData, ttl = 300) {
    const cacheKey = `api:${endpoint}:${this.hashParams(params)}`;
    return await this.set(cacheKey, responseData, ttl);
  }

  async delApiCache(endpoint, params = '') {
    const cacheKey = `api:${endpoint}:${this.hashParams(params)}`;
    return await this.del(cacheKey);
  }

  /**
   * 学习记录缓存
   */
  async getLearningRecordsCache(userId) {
    return await this.get(`learning:records:${userId}`);
  }

  async setLearningRecordsCache(userId, recordsData, ttl = 600) {
    return await this.set(`learning:records:${userId}`, recordsData, ttl);
  }

  async delLearningRecordsCache(userId) {
    return await this.del(`learning:records:${userId}`);
  }

  /**
   * 统计数据缓存
   */
  async getStatsCache(type) {
    return await this.get(`stats:${type}`);
  }

  async setStatsCache(type, statsData, ttl = 900) { // 统计数据缓存15分钟
    return await this.set(`stats:${type}`, statsData, ttl);
  }

  async delStatsCache(type) {
    return await this.del(`stats:${type}`);
  }

  /**
   * 清空所有用户相关缓存
   */
  async clearUserCaches() {
    const patterns = ['user:*', 'users:*', 'session:*'];
    let totalDeleted = 0;
    
    for (const pattern of patterns) {
      const deleted = await this.delPattern(pattern);
      totalDeleted += deleted;
    }
    
    console.log(`🗑️ 清空用户缓存: ${totalDeleted} 个键`);
    return totalDeleted;
  }

  /**
   * 清空所有API缓存
   */
  async clearApiCaches() {
    const deleted = await this.delPattern('api:*');
    console.log(`🗑️ 清空API缓存: ${deleted} 个键`);
    return deleted;
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats() {
    try {
      const allKeys = await cacheClient.keys(this.keyPrefix + '*');
      
      const stats = {
        totalKeys: allKeys.length,
        keysByType: {},
        cacheStatus: cacheClient.getStatus()
      };

      // 按类型统计
      for (const fullKey of allKeys) {
        const key = fullKey.replace(this.keyPrefix, '');
        const type = key.split(':')[0];
        stats.keysByType[type] = (stats.keysByType[type] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error.message);
      return {
        totalKeys: 0,
        keysByType: {},
        cacheStatus: { available: false, type: 'Unknown' },
        error: error.message
      };
    }
  }

  /**
   * 参数哈希（用于API缓存键）
   */
  hashParams(params) {
    if (!params) return 'empty';
    
    if (typeof params === 'object') {
      params = JSON.stringify(params);
    }
    
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < params.length; i++) {
      const char = params.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 缓存装饰器 - 用于包装函数
   */
  cacheWrapper(key, ttl = this.defaultTTL) {
    return (target, propertyName, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const cacheKey = typeof key === 'function' ? key(...args) : key;
        
        // 尝试从缓存获取
        const cached = await this.get(cacheKey);
        if (cached) {
          return cached;
        }
        
        // 执行原方法
        const result = await originalMethod.apply(this, args);
        
        // 缓存结果
        if (result) {
          await this.set(cacheKey, result, ttl);
        }
        
        return result;
      };
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const pingResult = await cacheClient.ping();
      const stats = await this.getCacheStats();
      
      return {
        status: 'healthy',
        ping: pingResult,
        stats: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建缓存服务单例
const cacheService = new CacheService();

module.exports = {
  CacheService,
  cacheService
};
