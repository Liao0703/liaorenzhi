const { cacheService } = require('../services/cacheService');

/**
 * 缓存中间件工厂函数
 * @param {Object} options 缓存配置选项
 * @param {number} options.ttl 缓存存活时间（秒）
 * @param {string} options.keyGenerator 缓存键生成器
 * @param {boolean} options.skipCache 是否跳过缓存
 * @param {Array} options.methods 需要缓存的HTTP方法
 * @param {Function} options.condition 缓存条件判断函数
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300,  // 默认5分钟
    keyGenerator = null,
    skipCache = false,
    methods = ['GET'],
    condition = null,
    varyBy = [] // 根据请求参数变化
  } = options;

  return async (req, res, next) => {
    // 检查是否应该使用缓存
    if (skipCache || !methods.includes(req.method)) {
      return next();
    }

    // 检查自定义缓存条件
    if (condition && !condition(req)) {
      return next();
    }

    try {
      // 生成缓存键
      const cacheKey = generateCacheKey(req, keyGenerator, varyBy);
      
      // 尝试从缓存获取数据
      const cachedResponse = await cacheService.getApiCache(
        req.route?.path || req.path,
        cacheKey
      );

      if (cachedResponse) {
        console.log(`🎯 缓存命中: ${req.method} ${req.path}`);
        
        // 设置缓存相关头部
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': ttl
        });

        // 返回缓存的响应
        return res.json(cachedResponse);
      }

      console.log(`📭 缓存未命中: ${req.method} ${req.path}`);
      res.set('X-Cache', 'MISS');

      // 拦截res.json方法来缓存响应
      const originalJson = res.json;
      res.json = function(data) {
        // 只缓存成功响应（状态码 200-299）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 异步缓存响应数据
          cacheService.setApiCache(
            req.route?.path || req.path,
            cacheKey,
            data,
            ttl
          ).catch(error => {
            console.error('❌ 缓存响应失败:', error.message);
          });

          console.log(`💾 响应已缓存: ${req.method} ${req.path} (TTL: ${ttl}s)`);
        }

        // 设置缓存相关头部
        res.set({
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': ttl
        });

        // 调用原始的json方法
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      console.error('❌ 缓存中间件错误:', error.message);
      // 缓存失败不应该影响正常请求
      next();
    }
  };
};

/**
 * 生成缓存键
 */
function generateCacheKey(req, keyGenerator, varyBy = []) {
  if (keyGenerator && typeof keyGenerator === 'function') {
    return keyGenerator(req);
  }

  const keyParts = [req.method, req.path];
  
  // 添加查询参数
  if (Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    keyParts.push('query', sortedQuery);
  }

  // 添加请求体参数（POST/PUT请求）
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body);
    keyParts.push('body', bodyStr);
  }

  // 添加自定义变化参数
  for (const vary of varyBy) {
    if (req.headers[vary]) {
      keyParts.push(vary, req.headers[vary]);
    }
  }

  // 添加用户ID（如果已认证）
  if (req.user && req.user.userId) {
    keyParts.push('user', req.user.userId);
  }

  return keyParts.join(':');
}

/**
 * 条件缓存中间件 - 根据条件决定是否缓存
 */
const conditionalCache = (condition, cacheOptions = {}) => {
  return cacheMiddleware({
    ...cacheOptions,
    condition
  });
};

/**
 * 用户特定缓存中间件
 */
const userCache = (ttl = 300) => {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const userId = req.user?.userId || 'anonymous';
      const path = req.path;
      const query = Object.keys(req.query).length > 0 
        ? JSON.stringify(req.query) 
        : '';
      return `user_${userId}:${path}:${query}`;
    }
  });
};

/**
 * API响应缓存中间件（通用）
 */
const apiCache = (ttl = 300) => {
  return cacheMiddleware({
    ttl,
    methods: ['GET'],
    keyGenerator: (req) => {
      const path = req.path;
      const query = Object.keys(req.query).length > 0 
        ? JSON.stringify(req.query) 
        : '';
      return `api:${path}:${query}`;
    }
  });
};

/**
 * 缓存清除中间件 - 在数据修改后清除相关缓存
 */
const cacheInvalidation = (patterns = []) => {
  return async (req, res, next) => {
    // 拦截响应完成事件
    res.on('finish', async () => {
      // 只在成功响应后清除缓存
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const pattern of patterns) {
            if (typeof pattern === 'function') {
              const dynamicPattern = pattern(req, res);
              await cacheService.delPattern(dynamicPattern);
            } else {
              await cacheService.delPattern(pattern);
            }
          }
        } catch (error) {
          console.error('❌ 缓存清除失败:', error.message);
        }
      }
    });

    next();
  };
};

/**
 * 缓存预热中间件
 */
const cacheWarmup = (warmupFunction, interval = 300000) => { // 默认5分钟预热一次
  let warmupTimer = null;
  
  const startWarmup = () => {
    if (warmupTimer) {
      clearInterval(warmupTimer);
    }
    
    warmupTimer = setInterval(async () => {
      try {
        console.log('🔥 开始缓存预热...');
        await warmupFunction();
        console.log('✅ 缓存预热完成');
      } catch (error) {
        console.error('❌ 缓存预热失败:', error.message);
      }
    }, interval);
  };

  // 立即执行一次预热
  warmupFunction().catch(error => {
    console.error('❌ 初始缓存预热失败:', error.message);
  });

  // 启动定期预热
  startWarmup();

  return (req, res, next) => {
    next();
  };
};

/**
 * 缓存统计中间件
 */
const cacheStats = () => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const cacheStatus = res.get('X-Cache') || 'UNKNOWN';
      
      console.log(`📊 ${req.method} ${req.path} - ${cacheStatus} - ${duration}ms`);
      
      // 可以在这里添加更详细的统计逻辑
      // 比如记录到数据库或监控系统
    });
    
    next();
  };
};

module.exports = {
  cacheMiddleware,
  conditionalCache,
  userCache,
  apiCache,
  cacheInvalidation,
  cacheWarmup,
  cacheStats
};
