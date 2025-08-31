#!/bin/bash
# 快速修复CORS问题（手动指定域名）

echo "=== 快速修复CORS问题 ==="

cd /www/wwwroot/learning-platform/server

# 1. 备份文件
cp app.js app.js.backup

# 2. 获取当前访问的域名（从nginx配置）
DOMAIN=$(grep -r "server_name" /etc/nginx/conf.d/ 2>/dev/null | grep -v "#" | head -1 | awk '{print $2}' | sed 's/;//')

if [ -z "$DOMAIN" ]; then
    echo "未能自动获取域名，请手动输入您的域名："
    read DOMAIN
fi

echo "使用域名: $DOMAIN"

# 3. 修改CORS配置 - 添加动态允许所有源（临时解决方案）
cat > cors-fix.js << 'EOF'
// 在corsOptions定义之前添加
const getDynamicOrigins = () => {
  const origins = [
    // 本地开发
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:8080',
    'http://localhost:3002',
    'http://localhost:4000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3002'
  ];
  
  // 从环境变量添加
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()));
  }
  
  // 添加当前域名的各种协议版本
  if (process.env.DOMAIN_NAME) {
    origins.push(
      `http://${process.env.DOMAIN_NAME}`,
      `https://${process.env.DOMAIN_NAME}`,
      `http://www.${process.env.DOMAIN_NAME}`,
      `https://www.${process.env.DOMAIN_NAME}`
    );
  }
  
  return origins;
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getDynamicOrigins();
    
    // 允许没有origin的请求（比如Postman）
    if (!origin) return callback(null, true);
    
    // 检查是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // 临时：记录被拒绝的源
      console.log('CORS拒绝的源:', origin);
      console.log('允许的源列表:', allowedOrigins);
      // 暂时允许所有HTTPS源（生产环境请谨慎）
      if (origin.startsWith('https://')) {
        callback(null, true);
      } else {
        callback(new Error('CORS策略不允许此源'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'user-id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24小时
};
EOF

# 4. 更新环境变量
echo "DOMAIN_NAME=$DOMAIN" >> .env
echo "ALLOWED_ORIGINS=https://$DOMAIN,http://$DOMAIN,https://www.$DOMAIN,http://www.$DOMAIN" >> .env

# 5. 重启PM2
echo "重启应用..."
npx pm2 restart learning-platform

echo "=== 完成 ==="
echo "CORS配置已更新，允许来自 $DOMAIN 的请求"
