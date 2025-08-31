# 宝塔PHP项目部署指南 - 兴隆场车站班前学习监督系统

## 🎯 项目概述

- **域名**: 47.109.142.72
- **后端**: PHP (Slim 4框架)
- **前端**: React + TypeScript
- **数据库**: MySQL
- **环境**: 宝塔面板

---

## 📁 需要的文件列表

### ✅ 必需文件

**PHP后端文件夹:**
```
php-backend/                    # PHP后端完整目录
├── public/                     # 网站根目录 
│   ├── index.php              # 入口文件
│   └── .htaccess              # Apache重写规则
├── src/                       # PHP源代码
├── config/                    # 配置文件
├── composer.json              # PHP依赖配置
├── composer.lock              # 锁定依赖版本
├── .env.example               # 环境配置示例
└── deploy-to-baota.sh         # 部署脚本
```

**前端构建文件:**
```
dist/                          # 前端构建产物（需要先构建）
├── index.html
├── assets/
└── ...
```

**SQL数据库文件:**
```
server/init.sql                # 数据库初始化脚本
```

### ❌ 不需要的文件

**Node.js相关文件 (不需要):**
```
server/                        # Node.js后端目录 - 不需要
ecosystem.config.js            # PM2配置 - 不需要
nginx-baota.conf               # Node.js版nginx配置 - 不需要
宝塔快速部署指南.md            # Node.js版部署指南 - 不需要
```

**开发文件 (不需要):**
```
src/                           # React源码 - 仅本地构建用
node_modules/                  # Node.js依赖 - 不需要上传
package.json                   # 前端依赖 - 仅本地构建用
```

**其他不需要的文件:**
```
.git/                          # Git历史
uploads/                       # 旧上传文件夹
各种.md文档                    # 说明文档
docker相关文件                 # 容器化相关
```

---

## 🚀 部署步骤

### 第一步: 准备服务器环境

1. **在宝塔面板安装必需组件:**
   - PHP 7.4 或 8.0
   - MySQL 5.7+
   - Nginx
   - Composer (PHP包管理器)

2. **创建数据库:**
   - 数据库名: `learning_platform`
   - 用户名: `learning_platform`
   - 密码: 设置一个强密码

### 第二步: 上传PHP后端

1. **创建网站:**
   - 在宝塔面板 → 网站 → 添加站点
   - 域名: `47.109.142.72`
   - 根目录: `/www/wwwroot/47.109.142.72`
   - PHP版本: 选择7.4或8.0

2. **上传PHP代码:**
   ```bash
   # 将整个php-backend目录上传到服务器
   /www/wwwroot/47.109.142.72/php-backend/
   ```

3. **修改网站根目录:**
   - 在宝塔面板网站设置中
   - 将运行目录修改为: `/php-backend/public`

4. **设置环境配置:**
   ```bash
   # 进入PHP后端目录
   cd /www/wwwroot/47.109.142.72/php-backend
   
   # 复制配置文件
   cp .env.example .env
   
   # 编辑.env文件，设置数据库连接
   nano .env
   ```

   **环境配置内容:**
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_NAME="兴隆场车站学习平台"

   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=learning_platform
   DB_USERNAME=learning_platform
   DB_PASSWORD=你的数据库密码

   JWT_SECRET=your-super-secret-key-here
   JWT_EXPIRE=86400

   UPLOAD_PATH=/www/wwwroot/47.109.142.72/php-backend/uploads
   MAX_UPLOAD_SIZE=52428800
   ```

5. **运行部署脚本:**
   ```bash
   cd /www/wwwroot/47.109.142.72/php-backend
   chmod +x deploy-to-baota.sh
   ./deploy-to-baota.sh
   ```

### 第三步: 导入数据库

1. **上传SQL文件:**
   将 `server/init.sql` 上传到服务器

2. **导入数据库:**
   ```bash
   mysql -u learning_platform -p learning_platform < /path/to/init.sql
   ```

   或在宝塔面板 → 数据库 → 导入

### 第四步: 构建并上传前端

1. **本地构建前端:**
   ```bash
   # 在项目根目录执行
   npm install
   npm run build
   ```

2. **上传dist目录:**
   将生成的 `dist/` 目录上传到:
   ```
   /www/wwwroot/47.109.142.72/dist/
   ```

### 第五步: 配置Nginx

创建新的nginx配置文件 `/www/server/panel/vhost/nginx/47.109.142.72.conf`:

```nginx
server {
    listen 80;
    server_name 47.109.142.72;
    root /www/wwwroot/47.109.142.72;
    index index.html;

    # 前端静态文件
    location / {
        root /www/wwwroot/47.109.142.72/dist;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # PHP API接口
    location /api/ {
        root /www/wwwroot/47.109.142.72;
        rewrite ^/api/(.*)$ /php-backend/public/index.php/$1 last;
        
        location ~ \.php($|/) {
            fastcgi_pass unix:/tmp/php-cgi-74.sock;  # 根据PHP版本调整
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO $fastcgi_path_info;
            fastcgi_param PATH_TRANSLATED $document_root$fastcgi_path_info;
        }
    }

    # 健康检查
    location /health {
        rewrite ^/health$ /php-backend/public/index.php/health last;
        
        location ~ \.php($|/) {
            fastcgi_pass unix:/tmp/php-cgi-74.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        }
    }

    # 文件上传目录
    location /uploads/ {
        root /www/wwwroot/47.109.142.72/php-backend;
        expires 1y;
    }

    # 安全设置
    location ~ /\.ht {
        deny all;
    }
    
    location ~ /\.env {
        deny all;
    }

    # 日志
    access_log /www/wwwlogs/47.109.142.72.access.log;
    error_log /www/wwwlogs/47.109.142.72.error.log;
}
```

### 第六步: 设置文件权限

```bash
# 设置PHP后端权限
cd /www/wwwroot/47.109.142.72/php-backend
chmod -R 755 .
chmod -R 777 logs uploads var/cache

# 设置前端权限
chmod -R 755 /www/wwwroot/47.109.142.72/dist

# 设置所有者
chown -R www:www /www/wwwroot/47.109.142.72
```

---

## 🧪 测试部署

### 1. 测试PHP后端
```bash
# 访问健康检查
curl http://47.109.142.72/health

# 或在浏览器访问
http://47.109.142.72/health
```

### 2. 测试前端
访问: http://47.109.142.72
应该能看到登录页面

### 3. 测试API
访问: http://47.109.142.72/php-backend/public/test-api.html
进行完整API测试

---

## 🔐 默认账户信息

| 用户名 | 密码 | 角色 | 用途 |
|--------|------|------|------|
| admin | admin123456 | 管理员 | 系统管理 |
| demo | demo123456 | 普通用户 | 演示学习 |
| maintenance | maintenance123456 | 维护用户 | 系统维护 |

⚠️ **部署完成后请立即修改这些默认密码！**

---

## 🛠️ 故障排除

### 问题1: PHP后端404错误
**解决方案:**
1. 检查网站运行目录是否设置为 `/php-backend/public`
2. 确认Apache/Nginx的rewrite模块已启用
3. 检查.htaccess文件是否存在

### 问题2: 数据库连接失败
**解决方案:**
1. 检查.env文件中的数据库配置
2. 确认数据库用户权限
3. 测试数据库连接

### 问题3: 前端API请求失败
**解决方案:**
1. 检查nginx配置中的API代理设置
2. 确认PHP-FPM运行正常
3. 查看nginx错误日志

### 问题4: 文件上传失败
**解决方案:**
1. 检查uploads目录权限
2. 确认PHP上传限制配置
3. 检查磁盘空间

---

## 📋 部署检查清单

- [ ] 宝塔面板环境准备完成
- [ ] PHP版本7.4+已安装
- [ ] MySQL数据库创建完成
- [ ] PHP后端代码上传完成
- [ ] Composer依赖安装完成
- [ ] .env环境配置正确
- [ ] 数据库导入完成
- [ ] 前端构建并上传完成
- [ ] Nginx配置更新完成
- [ ] 文件权限设置正确
- [ ] 健康检查通过
- [ ] 前端页面可访问
- [ ] API接口正常

---

## 📞 技术支持

如遇问题，请提供以下信息：
1. 错误截图
2. PHP错误日志: `/www/wwwlogs/47.109.142.72.error.log`
3. Nginx错误日志
4. 浏览器控制台错误信息

测试页面: http://47.109.142.72/php-backend/public/test-api.html
