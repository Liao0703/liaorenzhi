# 🚄 学习平台PHP版本宝塔部署指南

## 🎯 为什么选择PHP版本？

PHP版本具有以下优势：
- ✅ 宝塔面板完美支持，部署简单
- ✅ 无需复杂的Node.js依赖管理
- ✅ 稳定性高，维护成本低
- ✅ 与现有前端完美兼容
- ✅ 支持所有原有功能

## 📦 项目结构

```
php-backend/
├── public/                 # 网站根目录
│   ├── index.php          # 入口文件
│   └── .htaccess          # Apache重写规则
├── src/                   # 源代码
│   ├── Application/       # 应用层
│   ├── Domain/            # 领域层
│   └── Infrastructure/    # 基础设施层
├── config/                # 配置文件
├── logs/                  # 日志目录
├── uploads/               # 文件上传目录
├── composer.json          # PHP依赖配置
├── .env                   # 环境变量
└── deploy-to-baota.sh     # 部署脚本
```

## 🚀 宝塔面板部署步骤

### 步骤1：环境准备

1. **安装PHP**
   - 在宝塔面板安装 **PHP 7.4** 或 **PHP 8.0**
   - 安装必需扩展：`mysqli`, `pdo_mysql`, `json`, `mbstring`, `openssl`

2. **安装Composer**
   ```bash
   # SSH连接服务器
   curl -sS https://getcomposer.org/installer | php
   mv composer.phar /usr/local/bin/composer
   chmod +x /usr/local/bin/composer
   ```

### 步骤2：上传项目文件

1. **打包PHP后端**
   ```bash
   # 在本地项目目录下
   cd learning-platform
   tar -czf php-backend.tar.gz php-backend/
   ```

2. **上传到服务器**
   - 使用宝塔文件管理器上传 `php-backend.tar.gz`
   - 解压到 `/www/wwwroot/your-domain.com/`

### 步骤3：运行部署脚本

```bash
# SSH连接到服务器
cd /www/wwwroot/your-domain.com/php-backend
chmod +x deploy-to-baota.sh
./deploy-to-baota.sh
```

### 步骤4：宝塔面板配置

#### 4.1 创建网站
1. 点击 **"网站"** → **"添加站点"**
2. 填写配置：
   ```
   域名: your-domain.com (或IP地址)
   网站目录: /www/wwwroot/your-domain.com/php-backend/public
   PHP版本: 7.4 或 8.0
   ```

#### 4.2 配置数据库连接
编辑 `.env` 文件：
```bash
cd /www/wwwroot/your-domain.com/php-backend
nano .env
```

更新数据库配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=learning_platform
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your-super-secret-key-change-this
```

#### 4.3 导入数据库
在宝塔面板 → 数据库 → 管理 → 导入，上传并执行之前的 `server/init.sql` 文件

### 步骤5：前端适配PHP后端

更新前端API配置文件 `src/config/api.ts`：

```typescript
// 修改API基础URL配置
const getApiBaseUrl = () => {
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envUrl) {
    return String(envUrl).replace(/\/$/, '');
  }

  const { hostname, protocol } = window.location;

  // PHP后端配置
  if (
    hostname === '116.62.65.246' ||
    hostname === 'your-domain.com' ||
    hostname.includes('vercel.app')
  ) {
    return '/api';  // 通过Nginx代理访问PHP后端
  }

  // 本地开发
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost/api'; // 本地PHP开发服务器
  }

  return `${protocol}//${hostname}/api`;
};
```

#### 5.1 配置Nginx反向代理（可选）

如果需要API路径代理，在网站配置中添加：

```nginx
# API代理到PHP
location /api/ {
    try_files $uri $uri/ /index.php?$query_string;
}

# 文件上传访问
location /uploads/ {
    alias /www/wwwroot/your-domain.com/php-backend/uploads/;
    expires 1d;
}
```

### 步骤6：验证部署

#### 6.1 检查API服务
访问以下URL测试：
- `http://your-domain.com/health` - 健康检查
- `http://your-domain.com/api/` - API根路径

#### 6.2 测试功能
1. **登录测试**
   ```bash
   curl -X POST http://your-domain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"demo","password":"demo123456"}'
   ```

2. **文章列表测试**
   ```bash
   curl http://your-domain.com/api/articles
   ```

## 🔧 常见问题解决

### 问题1：Composer安装失败
```bash
# 使用国内镜像
composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/
composer install
```

### 问题2：权限问题
```bash
# 设置正确权限
chown -R www:www /www/wwwroot/your-domain.com/php-backend
chmod -R 755 /www/wwwroot/your-domain.com/php-backend
chmod -R 777 /www/wwwroot/your-domain.com/php-backend/logs
chmod -R 777 /www/wwwroot/your-domain.com/php-backend/uploads
```

### 问题3：数据库连接失败
1. 检查 `.env` 配置是否正确
2. 确认数据库用户权限
3. 测试数据库连接：
   ```bash
   mysql -u username -p database_name
   ```

### 问题4：404错误
1. 检查 `.htaccess` 文件是否存在
2. 确认Apache mod_rewrite模块已启用
3. 检查网站根目录是否指向 `public` 文件夹

## 📊 性能优化

### 1. 启用PHP OpCache
在宝塔面板 → PHP设置 → 配置修改，启用 OpCache

### 2. 配置缓存
```env
# 在.env中添加Redis缓存（可选）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 3. 数据库优化
- 为常用查询字段添加索引
- 启用MySQL查询缓存
- 定期清理过期日志

## 🔒 安全配置

### 1. 隐藏敏感文件
`.htaccess` 已配置隐藏 `.env` 和 `composer.*` 文件

### 2. 修改默认密码
```sql
-- 修改默认用户密码
UPDATE users SET password = '$2a$10$新的哈希密码' WHERE username = 'admin';
```

### 3. 定期备份
- 设置数据库自动备份
- 备份uploads目录
- 备份 `.env` 配置文件

## 📈 监控和维护

### 1. 日志监控
```bash
# 查看应用日志
tail -f /www/wwwroot/your-domain.com/php-backend/logs/app.log

# 查看访问日志
tail -f /www/wwwroot/logs/your-domain.com.log
```

### 2. 定期清理
```bash
# 清理过期日志（保留30天）
find /www/wwwroot/your-domain.com/php-backend/logs -name "*.log" -mtime +30 -delete
```

## 🎉 部署完成！

PHP版本部署完成后，你将获得：
- ✅ 稳定的API服务
- ✅ 完整的用户认证系统
- ✅ 文章和学习记录管理
- ✅ 文件上传功能
- ✅ 完善的错误处理和日志记录

**默认账户：**
- 管理员：`admin` / `admin123456`
- 演示用户：`demo` / `demo123456`
- 维护用户：`maintenance` / `maintenance123456`

🔥 **重要提醒：生产环境请立即修改默认密码！**




