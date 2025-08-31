const NodeCache = require('node-cache');

// 创建缓存实例
const statsCache = new NodeCache({
  stdTTL: 300, // 默认缓存5分钟
  checkperiod: 60, // 每60秒检查过期键
  useClones: false // 提高性能
});

// 缓存键定义
const CACHE_KEYS = {
  OVERVIEW_STATS: 'overview_stats',
  REALTIME_STATS: 'realtime_stats',
  DEPARTMENT_STATS: 'department_stats_',
  JOB_TYPE_STATS: 'job_type_stats_',
  LEARNING_TREND: 'learning_trend',
  ARTICLE_STATS: 'article_stats'
};

// 缓存中间件
const statisticsCache = (cacheKey, ttl = 300) => {
  return async (req, res, next) => {
    try {
      // 构建完整的缓存键（包含用户信息）
      const fullKey = `${cacheKey}_${req.user?.id || 'anonymous'}`;
      
      // 检查缓存
      const cachedData = statsCache.get(fullKey);
      if (cachedData) {
        console.log(`缓存命中: ${fullKey}`);
        return res.json(cachedData);
      }
      
      // 缓存未命中，继续处理请求
      console.log(`缓存未命中: ${fullKey}`);
      
      // 拦截响应以缓存数据
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // 只缓存成功的响应
        if (data && data.success) {
          statsCache.set(fullKey, data, ttl);
          console.log(`数据已缓存: ${fullKey}, TTL: ${ttl}秒`);
        }
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      console.error('缓存中间件错误:', error);
      next(); // 出错时继续处理，不影响正常功能
    }
  };
};

// 清除特定缓存
const clearStatisticsCache = (pattern) => {
  const keys = statsCache.keys();
  let clearedCount = 0;
  
  keys.forEach(key => {
    if (!pattern || key.includes(pattern)) {
      statsCache.del(key);
      clearedCount++;
    }
  });
  
  console.log(`清除了 ${clearedCount} 个缓存项`);
  return clearedCount;
};

// 获取缓存统计信息
const getCacheStats = () => {
  const keys = statsCache.keys();
  const stats = {
    totalKeys: keys.length,
    keys: {},
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
  };
  
  keys.forEach(key => {
    const ttl = statsCache.getTtl(key);
    const data = statsCache.get(key);
    stats.keys[key] = {
      ttl: ttl ? new Date(ttl).toISOString() : 'expired',
      size: JSON.stringify(data).length
    };
  });
  
  return stats;
};

// 预热缓存
const warmUpCache = async (pool) => {
  try {
    console.log('开始预热统计缓存...');
    
    // 预热基础统计数据
    const [basicStats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'user') as totalUsers,
        (SELECT COUNT(DISTINCT user_id) FROM learning_records 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) as activeUsers,
        (SELECT COUNT(*) FROM articles) as totalArticles
    `);
    
    // 缓存基础统计
    const overviewKey = `${CACHE_KEYS.OVERVIEW_STATS}_admin`;
    statsCache.set(overviewKey, {
      success: true,
      data: { stats: basicStats[0] }
    }, 600); // 缓存10分钟
    
    console.log('统计缓存预热完成');
  } catch (error) {
    console.error('缓存预热失败:', error);
  }
};

// 定期刷新缓存
const scheduleRefresh = (pool, interval = 300000) => { // 默认5分钟
  setInterval(async () => {
    try {
      await warmUpCache(pool);
    } catch (error) {
      console.error('定期缓存刷新失败:', error);
    }
  }, interval);
};

// Redis缓存适配器（如果可用）
class RedisCacheAdapter {
  constructor(redisClient) {
    this.redis = redisClient;
    this.prefix = 'stats:';
  }
  
  async get(key) {
    try {
      const data = await this.redis.get(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }
  
  async set(key, value, ttl = 300) {
    try {
      await this.redis.setex(
        this.prefix + key,
        ttl,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
  
  async del(pattern) {
    try {
      const keys = await this.redis.keys(this.prefix + pattern + '*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }
}

// 导出
module.exports = {
  statisticsCache,
  clearStatisticsCache,
  getCacheStats,
  warmUpCache,
  scheduleRefresh,
  RedisCacheAdapter,
  CACHE_KEYS
};
