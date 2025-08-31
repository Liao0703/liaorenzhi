const redis = require('redis');
require('dotenv').config();

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  // 连接配置
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: true
};

// 创建Redis客户端
let redisClient = null;
let isRedisAvailable = false;

const createRedisClient = async () => {
  try {
    // 创建Redis客户端
    redisClient = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: redisConfig.connectTimeout,
        commandTimeout: redisConfig.commandTimeout,
        keepAlive: redisConfig.keepAlive
      },
      password: redisConfig.password || undefined,
      database: redisConfig.db
    });

    // 错误处理
    redisClient.on('error', (err) => {
      console.error('❌ Redis连接错误:', err.message);
      isRedisAvailable = false;
      // 不要退出程序，继续使用内存缓存
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis正在连接...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis连接成功');
      isRedisAvailable = true;
    });

    redisClient.on('end', () => {
      console.log('📡 Redis连接已断开');
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis正在重连...');
    });

    // 尝试连接（设置超时）
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis连接超时')), 5000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    // 测试连接
    await redisClient.ping();
    console.log('✅ Redis连接测试成功');
    
    return redisClient;

  } catch (error) {
    console.error('❌ Redis连接失败:', error.message);
    console.log('🔄 系统将使用内存缓存作为降级方案');
    isRedisAvailable = false;
    
    // 清理失败的客户端
    if (redisClient) {
      try {
        await redisClient.disconnect();
      } catch (e) {
        // 忽略断开连接时的错误
      }
      redisClient = null;
    }
    
    return null;
  }
};

// 内存缓存降级方案
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  async get(key) {
    return this.cache.get(key) || null;
  }

  async set(key, value, options = {}) {
    const { EX } = options;
    this.cache.set(key, value);
    
    // 处理过期时间
    if (EX) {
      // 清除之前的定时器
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // 设置新的过期定时器
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, EX * 1000);
      
      this.timers.set(key, timer);
    }
    
    return 'OK';
  }

  async del(key) {
    const deleted = this.cache.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return deleted ? 1 : 0;
  }

  async exists(key) {
    return this.cache.has(key) ? 1 : 0;
  }

  async keys(pattern) {
    // 简单的模式匹配
    const allKeys = Array.from(this.cache.keys());
    if (pattern === '*') {
      return allKeys;
    }
    
    // 将Redis模式转换为正则表达式
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    
    return allKeys.filter(key => regex.test(key));
  }

  async flushAll() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    return 'OK';
  }

  async ping() {
    return 'PONG';
  }
}

// 创建内存缓存实例
const memoryCache = new MemoryCache();

// 缓存客户端代理（自动降级）
const cacheClient = {
  async get(key) {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.get(key);
      }
      return await memoryCache.get(key);
    } catch (error) {
      console.warn('缓存获取失败，使用内存缓存:', error.message);
      return await memoryCache.get(key);
    }
  },

  async set(key, value, options = {}) {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.set(key, value, options);
      }
      return await memoryCache.set(key, value, options);
    } catch (error) {
      console.warn('缓存设置失败，使用内存缓存:', error.message);
      return await memoryCache.set(key, value, options);
    }
  },

  async del(key) {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.del(key);
      }
      return await memoryCache.del(key);
    } catch (error) {
      console.warn('缓存删除失败，使用内存缓存:', error.message);
      return await memoryCache.del(key);
    }
  },

  async exists(key) {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.exists(key);
      }
      return await memoryCache.exists(key);
    } catch (error) {
      console.warn('缓存检查失败，使用内存缓存:', error.message);
      return await memoryCache.exists(key);
    }
  },

  async keys(pattern) {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.keys(pattern);
      }
      return await memoryCache.keys(pattern);
    } catch (error) {
      console.warn('缓存键查询失败，使用内存缓存:', error.message);
      return await memoryCache.keys(pattern);
    }
  },

  async flushAll() {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.flushAll();
      }
      return await memoryCache.flushAll();
    } catch (error) {
      console.warn('缓存清空失败，使用内存缓存:', error.message);
      return await memoryCache.flushAll();
    }
  },

  async ping() {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.ping();
      }
      return await memoryCache.ping();
    } catch (error) {
      console.warn('缓存ping失败，使用内存缓存:', error.message);
      return await memoryCache.ping();
    }
  },

  // 获取缓存状态
  getStatus() {
    return {
      available: isRedisAvailable,
      type: isRedisAvailable ? 'Redis' : 'Memory',
      host: redisConfig.host,
      port: redisConfig.port,
      connected: !!redisClient
    };
  }
};

// 初始化Redis连接
const initRedis = async () => {
  await createRedisClient();
  return cacheClient;
};

// 关闭Redis连接
const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis连接已关闭');
    } catch (error) {
      console.error('❌ Redis关闭失败:', error.message);
    }
  }
};

module.exports = {
  initRedis,
  closeRedis,
  cacheClient,
  isRedisAvailable: () => isRedisAvailable
};
