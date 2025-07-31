# ECS迁移指南

## 📋 迁移计划

### 阶段1：本地开发环境准备 ✅

1. **后端API开发** ✅
   - Express服务器框架
   - MySQL数据库设计
   - 用户认证系统
   - 文件上传处理

2. **数据库设计** ✅
   - 用户表 (users)
   - 文章表 (articles)
   - 问题表 (questions)
   - 照片表 (photos)
   - 学习记录表 (learning_records)
   - 系统设置表 (system_settings)

### 阶段2：本地测试环境

1. **安装MySQL**
   ```bash
   # macOS (使用Homebrew)
   brew install mysql
   brew services start mysql
   
   # 创建数据库
   mysql -u root -p
   CREATE DATABASE learning_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **配置环境变量**
   ```bash
   cd server
   cp env.example .env
   # 编辑.env文件，配置数据库连接信息
   ```

3. **安装依赖**
   ```bash
   cd server
   npm install
   ```

4. **启动后端服务**
   ```bash
   npm run dev
   ```

### 阶段3：前端API集成

1. **创建API服务**
   - 用户认证API
   - 文章管理API
   - 照片上传API
   - 学习记录API

2. **数据迁移**
   - 从localStorage迁移到数据库
   - 文件从OSS迁移到本地存储

### 阶段4：云服务器部署

1. **购买ECS实例**
   - 推荐配置：2核4GB
   - 操作系统：Ubuntu 20.04 LTS
   - 存储：40GB系统盘 + 100GB数据盘

2. **服务器环境配置**
   - 安装Node.js
   - 安装MySQL
   - 配置Nginx
   - 设置SSL证书

3. **应用部署**
   - 代码部署
   - 数据库迁移
   - 服务配置
   - 监控设置

## 🛠️ 本地开发步骤

### 1. 安装MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
- 下载MySQL安装包
- 安装并启动服务

**Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### 2. 创建数据库

```sql
CREATE DATABASE learning_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'learning_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON learning_platform.* TO 'learning_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 配置后端服务

```bash
cd server
cp env.example .env
```

编辑 `.env` 文件：
```env
DB_HOST=localhost
DB_USER=learning_user
DB_PASSWORD=your_password
DB_NAME=learning_platform
JWT_SECRET=your-secret-key
```

### 4. 启动服务

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📊 数据库结构

### 用户表 (users)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  email VARCHAR(100),
  phone VARCHAR(20),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 文章表 (articles)
```sql
CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  required_reading_time INT DEFAULT 30,
  file_type ENUM('pdf', 'word', 'none') DEFAULT 'none',
  file_url VARCHAR(500),
  file_name VARCHAR(200),
  storage_type ENUM('local', 'oss', 'hybrid') DEFAULT 'local',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 学习记录表 (learning_records)
```sql
CREATE TABLE learning_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  article_id INT NOT NULL,
  reading_time INT NOT NULL,
  quiz_score INT NOT NULL,
  status ENUM('completed', 'failed') DEFAULT 'completed',
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_article (user_id, article_id)
);
```

## 🔧 API接口设计

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 文章接口
- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章

### 照片接口
- `POST /api/photos` - 上传照片
- `GET /api/photos` - 获取照片列表
- `DELETE /api/photos/:id` - 删除照片

### 学习记录接口
- `POST /api/learning-records` - 保存学习记录
- `GET /api/learning-records` - 获取学习记录
- `GET /api/learning-records/statistics` - 获取统计数据

## 📈 性能优化

### 数据库优化
- 添加适当的索引
- 使用连接池
- 定期清理旧数据

### 文件存储优化
- 图片压缩
- 文件分片上传
- CDN加速

### 缓存策略
- Redis缓存热点数据
- 浏览器缓存静态资源
- API响应缓存

## 🔒 安全措施

### 认证安全
- JWT令牌过期机制
- 密码加密存储
- 登录失败限制

### 数据安全
- SQL注入防护
- XSS攻击防护
- CSRF防护

### 文件安全
- 文件类型验证
- 文件大小限制
- 病毒扫描

## 📝 部署检查清单

### 服务器环境
- [ ] Node.js 16+ 已安装
- [ ] MySQL 8.0+ 已安装
- [ ] Nginx 已配置
- [ ] SSL证书已安装
- [ ] 防火墙已配置

### 应用配置
- [ ] 环境变量已配置
- [ ] 数据库连接正常
- [ ] 文件上传目录已创建
- [ ] 日志目录已创建

### 服务监控
- [ ] 进程监控已配置
- [ ] 日志监控已配置
- [ ] 性能监控已配置
- [ ] 告警机制已配置

## 🚀 下一步计划

1. **完成本地测试**
   - 测试所有API接口
   - 验证数据迁移
   - 测试文件上传

2. **购买云服务器**
   - 选择合适的配置
   - 配置安全组
   - 安装必要软件

3. **部署应用**
   - 代码部署
   - 数据库迁移
   - 服务配置

4. **监控和维护**
   - 性能监控
   - 日志分析
   - 定期备份

---

**注意：** 在购买云服务器之前，建议先在本地完成所有开发和测试工作，确保功能正常后再进行部署。 