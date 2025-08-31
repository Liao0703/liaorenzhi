# 🚄 兴站智训通 - PHP后端

一个现代化的PHP REST API，专为宝塔面板环境优化，提供完整的学习管理功能。

## 🌟 特性

- ✅ **宝塔面板完美适配** - 专为宝塔环境优化
- ✅ **现代PHP架构** - 基于Slim 4框架，遵循PSR标准
- ✅ **完整的REST API** - 提供用户、文章、学习记录管理
- ✅ **JWT认证系统** - 安全的token认证
- ✅ **文件上传支持** - 多种文件格式上传
- ✅ **权限管理** - 用户、管理员、维护人员角色
- ✅ **错误处理** - 友好的错误信息和日志记录
- ✅ **数据库抽象** - 基于Doctrine DBAL

## 🏗️ 项目结构

```
php-backend/
├── public/                 # 网站根目录
│   ├── index.php          # 入口文件
│   ├── .htaccess          # Apache重写规则
│   └── test-api.html      # API测试页面
├── src/                   # 源代码
│   ├── Application/       # 应用层
│   │   ├── Actions/       # 控制器
│   │   ├── Middleware/    # 中间件
│   │   └── Handlers/      # 错误处理器
│   ├── Domain/            # 领域层
│   │   └── User/         # 用户领域模型
│   └── Infrastructure/    # 基础设施层
│       └── Persistence/   # 数据持久化
├── config/                # 配置文件
├── logs/                  # 日志目录
├── uploads/               # 文件上传目录
├── composer.json          # PHP依赖配置
└── .env                   # 环境变量
```

## 🚀 快速开始

### 1. 环境要求

- PHP >= 7.4
- MySQL >= 5.7
- Apache/Nginx
- Composer
- 宝塔面板（推荐）

### 2. 安装部署

**使用自动部署脚本：**

```bash
# 上传项目到服务器
cd /www/wwwroot/your-domain.com/php-backend

# 运行自动部署脚本
chmod +x deploy-to-baota.sh
./deploy-to-baota.sh
```

**手动部署：**

```bash
# 安装依赖
composer install --optimize-autoloader --no-dev

# 配置环境
cp .env.example .env
nano .env  # 编辑数据库配置

# 设置权限
chmod -R 755 .
chmod -R 777 logs uploads

# 导入数据库
mysql -u username -p database_name < ../server/init.sql
```

### 3. 宝塔面板配置

1. **创建网站**：
   - 域名：your-domain.com
   - 根目录：`/www/wwwroot/your-domain.com/php-backend/public`
   - PHP版本：7.4 或 8.0

2. **配置数据库**：
   - 数据库名：learning_platform
   - 导入SQL文件：`../server/init.sql`

3. **测试API**：
   访问 `http://your-domain.com/test-api.html`

## 📡 API文档

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 用户管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | 管理员 |
| GET | `/api/users/{id}` | 获取用户详情 | 自己/管理员 |
| POST | `/api/users` | 创建用户 | 管理员 |
| PUT | `/api/users/{id}` | 更新用户 | 自己/管理员 |
| DELETE | `/api/users/{id}` | 删除用户 | 管理员 |

### 文章管理

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/articles` | 获取文章列表 | 所有用户 |
| GET | `/api/articles/{id}` | 获取文章详情 | 所有用户 |
| POST | `/api/articles` | 创建文章 | 管理员 |
| PUT | `/api/articles/{id}` | 更新文章 | 管理员 |
| DELETE | `/api/articles/{id}` | 删除文章 | 管理员 |

### 学习记录

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/learning-records` | 获取学习记录 | 自己/管理员 |
| POST | `/api/learning-records` | 创建学习记录 | 认证用户 |
| PUT | `/api/learning-records/{id}` | 更新学习记录 | 自己/管理员 |
| DELETE | `/api/learning-records/{id}` | 删除学习记录 | 自己/管理员 |

### 文件上传

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/files/upload` | 上传文件 | 认证用户 |

### 系统信息

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 系统健康检查 |
| GET | `/api/` | API根路径信息 |

## 🔧 配置说明

### 环境变量 (.env)

```env
# 应用配置
APP_ENV=production
APP_DEBUG=false
APP_NAME="兴站智训通"

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=learning_platform
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=86400

# 文件上传配置
UPLOAD_PATH=/www/wwwroot/your-domain.com/php-backend/uploads
MAX_UPLOAD_SIZE=52428800
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,json,jpg,png,gif
```

## 🔐 默认用户

| 用户名 | 密码 | 角色 | 用途 |
|--------|------|------|------|
| admin | admin123456 | 管理员 | 系统管理 |
| demo | demo123456 | 普通用户 | 演示学习 |
| maintenance | maintenance123456 | 维护用户 | 系统维护 |

⚠️ **生产环境请立即修改默认密码！**

## 🛠️ 开发工具

### API测试

访问 `/test-api.html` 进行完整的API测试：
- 基础连接测试
- 用户认证测试
- 数据管理测试
- 文件上传测试
- 创建测试数据

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看访问日志
tail -f /www/wwwroot/logs/your-domain.com.log
```

### 数据库操作

```bash
# 连接数据库
mysql -u username -p learning_platform

# 查看用户
SELECT id, username, name, role FROM users;

# 查看文章
SELECT id, title, category, status FROM articles;
```

## 🔒 安全建议

1. **修改默认密码**
2. **使用强JWT密钥**
3. **定期备份数据库**
4. **监控访问日志**
5. **及时更新依赖包**

## 🐛 故障排除

### 常见问题

**1. Composer安装失败**
```bash
# 使用国内镜像
composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/
```

**2. 权限问题**
```bash
chown -R www:www /www/wwwroot/your-domain.com/php-backend
chmod -R 755 /www/wwwroot/your-domain.com/php-backend
chmod -R 777 /www/wwwroot/your-domain.com/php-backend/{logs,uploads}
```

**3. 数据库连接失败**
- 检查 `.env` 配置
- 确认数据库用户权限
- 测试数据库连接

**4. 404错误**
- 检查 `.htaccess` 文件
- 确认Apache mod_rewrite模块
- 检查网站根目录设置

## 📊 性能监控

### 系统监控

```bash
# 查看PHP进程
ps aux | grep php

# 查看内存使用
free -h

# 查看磁盘使用
df -h
```

### 数据库优化

```sql
-- 查看慢查询
SHOW PROCESSLIST;

-- 检查索引使用
SHOW INDEX FROM users;
SHOW INDEX FROM articles;
SHOW INDEX FROM learning_records;
```

## 📞 技术支持

- 访问 `/test-api.html` 进行功能测试
- 查看 `logs/app.log` 了解错误详情
- 检查数据库连接和权限设置
- 确认PHP扩展安装完整

## 📄 许可证

MIT License - 详见 LICENSE 文件




