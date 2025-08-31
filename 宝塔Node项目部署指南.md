# 宝塔Node.js项目部署指南 - 47.109.142.72

## 🎯 项目概述

- **域名**: 47.109.142.72
- **后端**: Node.js (Express框架)
- **前端**: React + TypeScript
- **数据库**: MySQL
- **环境**: 宝塔面板

---

## 📋 宝塔项目配置

从截图可以看到你已经在宝塔面板创建了Node项目，现在需要正确配置：

### ✅ **正确的宝塔配置**:
```
项目类型: Node项目 ✅
项目目录: /www/wwwroot/learning-platform ✅
项目名称: learning_platform ✅
启动选项: dev:vite ❌ 需要修改
Node版本: v20.15.1 ✅
包管理器: pnpm ✅
不安装node_module: ✅ (已勾选)
```

---

## 🛠️ 配置修正步骤

### 第一步：修正启动选项

**在宝塔面板中修改启动选项**：
```
从: dev:vite
改为: start:server
```

或者直接使用：
```
启动文件: server/app.js
启动方式: node server/app.js
```

### 第二步：创建正确的package.json启动脚本

在项目根目录创建或修改 `package.json`:

```json
{
  "name": "learning-platform",
  "version": "1.0.0",
  "scripts": {
    "start": "node server/app.js",
    "start:server": "node server/app.js",
    "start:prod": "NODE_ENV=production node server/app.js",
    "dev": "nodemon server/app.js",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mysql2": "^3.6.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "ioredis": "^5.7.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1"
  }
}
```

### 第三步：上传项目文件

**需要上传到服务器的文件**:
```
/www/wwwroot/learning-platform/
├── server/                    # Node.js后端完整目录
├── dist/                      # 前端构建文件 (npm run build生成)
├── package.json               # 项目配置
├── ecosystem.config.js        # PM2配置
└── .env                       # 环境变量(需要创建)
```

**不需要上传的文件**:
```
❌ node_modules/              # 服务器会自动安装
❌ src/                       # 前端源码，已构建到dist/
❌ php-backend/               # PHP后端目录
❌ uploads/                   # 旧的上传文件
```

### 第四步：创建环境变量文件

在服务器创建 `/www/wwwroot/learning-platform/.env`:

```env
NODE_ENV=production
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_USER=learning_platform
DB_PASSWORD=你的数据库密码
DB_NAME=learning_platform

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Redis配置 (可选)
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS配置
CORS_ORIGIN=http://47.109.142.72,https://47.109.142.72
```

### 第五步：配置数据库

1. **在宝塔面板创建数据库**:
   - 数据库名: `learning_platform`
   - 用户名: `learning_platform`  
   - 密码: 设置强密码

2. **导入数据库**:
   - 上传 `server/init.sql`
   - 在数据库管理中导入

### 第六步：配置Nginx代理

**在宝塔面板 → 网站 → 添加站点**:
- 域名: `47.109.142.72`
- 根目录: `/www/wwwroot/learning-platform/dist`

**配置反向代理**:
```nginx
# 在网站设置 → 反向代理 → 添加反向代理
目标URL: http://127.0.0.1:3001
发送域名: $host
```

**或者直接修改Nginx配置**:
```nginx
server {
    listen 80;
    server_name 47.109.142.72;
    root /www/wwwroot/learning-platform/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
        
        # 修复JS模块MIME类型
        location ~* \.js$ {
            add_header Content-Type "text/javascript; charset=UTF-8";
            expires 7d;
        }
        
        location ~* \.css$ {
            add_header Content-Type "text/css; charset=UTF-8";
            expires 7d;
        }
    }

    # API代理到Node.js后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API文档
    location /api-docs {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 监控面板  
    location /monitoring {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 日志
    access_log /www/wwwlogs/learning-platform.access.log;
    error_log /www/wwwlogs/learning-platform.error.log;
}
```

---

## 🚀 部署步骤总结

### 1. 本地准备
```bash
# 构建前端
npm run build

# 确认dist目录已生成
ls -la dist/
```

### 2. 上传文件
- 上传 `server/` 目录 → `/www/wwwroot/learning-platform/server/`
- 上传 `dist/` 目录 → `/www/wwwroot/learning-platform/dist/`  
- 上传 `package.json` → `/www/wwwroot/learning-platform/package.json`
- 上传 `ecosystem.config.js` → `/www/wwwroot/learning-platform/ecosystem.config.js`

### 3. 宝塔面板配置
- 修改Node项目启动选项为: `start:server`
- 创建数据库并导入SQL
- 创建 `.env` 环境变量文件
- 配置Nginx反向代理

### 4. 启动项目
在宝塔面板Node项目管理中点击"启动"

---

## ✅ 验证部署

### 测试后端
```bash
# 健康检查
curl http://47.109.142.72/health

# API状态
curl http://47.109.142.72/api/status
```

### 测试前端
- 访问: http://47.109.142.72
- 应该能看到登录页面，无JavaScript错误

### 测试API文档
- 访问: http://47.109.142.72/api-docs
- 可以看到完整的API文档

---

## 🔐 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123456 | 管理员 |
| demo | demo123456 | 普通用户 |
| maintenance | maintenance123456 | 维护用户 |

---

## 🛠️ 故障排除

### 问题1: Node项目启动失败
**解决方案:**
1. 检查package.json中的scripts配置
2. 确认启动选项设置正确  
3. 查看Node项目日志

### 问题2: 数据库连接失败
**解决方案:**
1. 检查.env文件数据库配置
2. 确认数据库用户权限
3. 测试数据库连接

### 问题3: 前端API请求失败
**解决方案:**
1. 检查Nginx反向代理配置
2. 确认Node.js服务运行在3001端口
3. 查看Nginx错误日志

### 问题4: CORS错误
**解决方案:**
1. 检查.env中的CORS_ORIGIN配置
2. 确认域名设置正确
3. Node.js后端已内置CORS支持

---

## 📞 常用命令

```bash
# 查看Node项目状态
pm2 status

# 查看日志
pm2 logs learning-platform-server

# 重启服务
pm2 restart learning-platform-server

# 查看端口占用
netstat -tlnp | grep 3001

# 测试数据库连接
mysql -u learning_platform -p learning_platform
```

---

## 🎯 成功标志

部署成功后，你应该能够：
1. ✅ 访问 http://47.109.142.72 看到登录页面
2. ✅ 登录系统并正常使用所有功能
3. ✅ API接口正常响应
4. ✅ 文件上传功能正常
5. ✅ 没有JavaScript或CORS错误
