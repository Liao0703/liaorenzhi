# 🚨 Node.js项目500错误完整修复方案

## 🔍 Node.js 500错误根本原因分析

**500 Internal Server Error** 在Node.js项目中通常表示：

1. **Node.js进程未启动或崩溃** - 最常见 ⭐⭐⭐⭐⭐
2. **PM2进程管理问题** - 进程死掉未重启 ⭐⭐⭐⭐
3. **数据库连接失败** - 云数据库连接超时 ⭐⭐⭐⭐
4. **代码运行时错误** - JavaScript异常未捕获 ⭐⭐⭐
5. **环境变量缺失** - env.cloud配置错误 ⭐⭐⭐
6. **端口占用冲突** - 3000端口被占用 ⭐⭐
7. **内存不足** - 服务器资源耗尽 ⭐

## 🛠️ Node.js 500错误紧急修复步骤

### 第一步：检查Node.js进程状态（最重要！）

```bash
# 检查Node.js进程是否运行
ps aux | grep node

# 检查3000端口是否被占用
netstat -tlnp | grep :3000

# 检查PM2进程状态
pm2 status
pm2 logs

# 如果使用systemd管理
systemctl status learning-platform
```

### 第二步：检查和修复PM2配置

```bash
# 停止所有PM2进程
pm2 stop all
pm2 delete all

# 重新启动Node.js应用
cd /www/wwwroot/learning-platform
pm2 start server.cjs --name "learning-platform" --instances 1

# 或使用ecosystem配置
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup
```

### 第三步：检查应用日志和错误

```bash
# 查看应用日志
pm2 logs learning-platform --lines 50

# 查看Nginx代理日志  
tail -f /www/wwwlogs/learning-platform.error.log

# 直接启动应用查看错误（调试模式）
cd /www/wwwroot/learning-platform
node server.cjs
```

### 第四步：验证环境配置

**检查env.cloud文件：**
```bash
cd /www/wwwroot/learning-platform
ls -la env.cloud
cat env.cloud
```

**正确的env.cloud配置应该包含：**
```env
# 数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# 服务器配置
PORT=3000
NODE_ENV=production

# 其他配置...
```

### 第五步：测试数据库连接

**创建数据库连接测试脚本：**
```bash
cat > /www/wwwroot/learning-platform/test-db-connection.js << 'EOF'
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'env.cloud' });

async function testConnection() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: 'utf8mb4',
        timeout: 30000
    };
    
    console.log('🔗 尝试连接数据库...');
    console.log('主机:', config.host);
    console.log('数据库:', config.database);
    
    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ 数据库连接成功！');
        
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log('✅ 用户表查询成功，用户数量:', rows[0].count);
        
        await connection.end();
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        process.exit(1);
    }
}

testConnection();
EOF

# 运行测试
node test-db-connection.js
```

### 第六步：修复Nginx反向代理配置

**检查Nginx配置文件：**
```nginx
# 在宝塔面板 → 网站 → 配置文件中，确保有以下配置：

server {
    listen 80;
    server_name 47.109.142.72;
    root /www/wwwroot/learning-platform/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
        
        # 修复MIME类型
        location ~* \.js$ {
            add_header Content-Type "text/javascript; charset=UTF-8";
        }
    }

    # API请求代理到Node.js后端
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
}
```

### 第七步：检查和安装Node.js依赖

```bash
cd /www/wwwroot/learning-platform

# 检查package.json
cat package.json

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install --production

# 或使用yarn
yarn install --production
```

## 🔧 Node.js专用故障排查命令

```bash
#!/bin/bash
echo "=== Node.js 500错误排查 ==="

# 1. 检查Node.js版本
echo "Node.js版本: $(node --version)"
echo "NPM版本: $(npm --version)"

# 2. 检查进程状态
echo "Node.js进程:"
ps aux | grep -E "(node|pm2)" | grep -v grep

# 3. 检查端口占用
echo "端口3000状态:"
netstat -tlnp | grep :3000 || echo "端口3000未被占用"

# 4. 检查PM2状态
if command -v pm2 &> /dev/null; then
    echo "PM2状态:"
    pm2 status
    echo "PM2日志:"
    pm2 logs --lines 10
else
    echo "PM2未安装"
fi

# 5. 检查关键文件
echo "关键文件检查:"
cd /www/wwwroot/learning-platform
[ -f "server.cjs" ] && echo "✅ server.cjs存在" || echo "❌ server.cjs缺失"
[ -f "env.cloud" ] && echo "✅ env.cloud存在" || echo "❌ env.cloud缺失"  
[ -f "package.json" ] && echo "✅ package.json存在" || echo "❌ package.json缺失"
[ -d "node_modules" ] && echo "✅ node_modules存在" || echo "❌ node_modules缺失"
[ -d "dist" ] && echo "✅ dist目录存在" || echo "❌ dist目录缺失"

# 6. 检查磁盘空间
echo "磁盘使用情况:"
df -h | head -2

# 7. 检查内存使用
echo "内存使用情况:"
free -h

echo "=== 排查完成 ==="
```

## ⚡ 快速修复命令（一键执行）

```bash
# Node.js项目一键修复脚本
cd /www/wwwroot/learning-platform

# 停止旧进程
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f server.cjs 2>/dev/null || true

# 重新安装依赖（如果需要）
# npm install --production

# 启动应用
pm2 start server.cjs --name "learning-platform" --instances 1 --log /www/wwwlogs/learning-platform-pm2.log

# 保存PM2配置
pm2 save
pm2 startup

# 重启Nginx
systemctl reload nginx

echo "✅ Node.js应用重启完成"
echo "📊 访问测试: http://47.109.142.72"
```

## 📊 验证修复结果

### 1. 检查进程状态
```bash
pm2 status
# 应该显示 learning-platform 进程在运行
```

### 2. 测试健康检查
```bash
curl http://127.0.0.1:3000/health
# 应该返回JSON响应
```

### 3. 测试前端页面
- 访问: http://47.109.142.72
- 应该能看到登录页面，不再显示500错误

### 4. 测试API接口
```bash
curl -X POST http://47.109.142.72/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

## 🚨 常见Node.js 500错误及解决方案

### 1. PM2进程死掉
**错误特征**: 进程列表中没有learning-platform
**解决**: `pm2 start server.cjs --name learning-platform`

### 2. 数据库连接超时
**错误特征**: 应用启动后很快崩溃，日志显示连接错误
**解决**: 检查云数据库白名单，确认服务器IP已添加

### 3. 端口冲突
**错误特征**: `Error: listen EADDRINUSE :::3000`
**解决**: `pkill -f server.cjs` 然后重新启动

### 4. 环境变量错误
**错误特征**: 数据库连接参数undefined
**解决**: 检查env.cloud文件路径和内容

### 5. Node.js版本不兼容
**错误特征**: 语法错误或模块加载失败
**解决**: 更新到Node.js 16+版本

## 💡 预防措施

1. **设置PM2监控**: `pm2 monitor`
2. **配置自动重启**: PM2的watch模式
3. **日志轮转**: 配置PM2日志管理
4. **监控告警**: 设置进程异常通知

完成以上步骤后，您的Node.js项目500错误应该完全解决！



