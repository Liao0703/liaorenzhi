# 技术规格

## 技术栈

### 前端技术
- **框架**: React 18.x
- **语言**: TypeScript 5.x
- **构建工具**: Vite 5.x
- **状态管理**: React Hooks (useState, useEffect)
- **路由**: React Router v6
- **UI组件**: Ant Design 5.x
- **HTTP客户端**: Axios
- **样式**: CSS Modules + Tailwind CSS

### 后端技术

#### Node.js后端
- **运行时**: Node.js 16.x+
- **框架**: Express 4.x
- **认证**: JWT (jsonwebtoken)
- **数据库驱动**: mysql2
- **文件上传**: Multer
- **进程管理**: PM2
- **API文档**: Swagger

#### PHP后端（备选）
- **版本**: PHP 7.4+
- **框架**: Slim Framework 4.x
- **依赖管理**: Composer
- **数据库**: PDO
- **认证**: JWT

### 数据库
- **类型**: MySQL 8.0
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **连接池**: 最大10个连接
- **云服务**: 阿里云RDS

### 服务器环境
- **Web服务器**: Nginx 1.20+
- **操作系统**: CentOS 7.x / Ubuntu 20.04
- **管理面板**: 宝塔面板 7.x
- **SSL证书**: Let's Encrypt

## 开发方法

### 版本控制
- Git
- 分支策略: main (生产) / develop (开发) / feature/* (功能)

### 代码规范

#### JavaScript/TypeScript
- ESLint配置
- Prettier格式化
- 命名规范: camelCase (变量/函数), PascalCase (组件/类)

#### PHP
- PSR-12编码规范
- 命名空间使用PSR-4自动加载

### API设计规范
- RESTful API设计
- JSON数据格式
- HTTP状态码规范使用
- 统一错误响应格式

## 数据库设计

### 主要数据表

#### users (用户表)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- username: VARCHAR(50) UNIQUE
- password: VARCHAR(255)
- name: VARCHAR(100)
- role: VARCHAR(20)
- email: VARCHAR(100)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### articles (文章表)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- title: VARCHAR(255)
- content: TEXT
- file_url: VARCHAR(500)
- category: VARCHAR(100)
- created_by: INT (FK -> users.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### learning_records (学习记录表)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT (FK -> users.id)
- article_id: INT (FK -> articles.id)
- progress: INT
- completed: BOOLEAN
- last_read_at: TIMESTAMP
- created_at: TIMESTAMP
```

#### files (文件表)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- filename: VARCHAR(255)
- original_name: VARCHAR(255)
- mime_type: VARCHAR(100)
- size: INT
- path: VARCHAR(500)
- uploaded_by: INT (FK -> users.id)
- created_at: TIMESTAMP
```

### 索引策略
- 主键索引: 所有id字段
- 唯一索引: username
- 普通索引: user_id, article_id, created_at
- 复合索引: (user_id, article_id) for learning_records

## 安全规范

### 认证与授权
- JWT Token有效期: 24小时
- 密码加密: bcrypt (成本因子10)
- 角色权限: admin, user, maintenance

### 数据安全
- SQL注入防护: 参数化查询
- XSS防护: 输入验证和输出转义
- CSRF防护: Token验证
- 文件上传: 类型和大小限制

### 网络安全
- HTTPS强制使用（生产环境）
- CORS配置白名单
- Rate Limiting: API请求限制
- 安全头部: X-Frame-Options, X-Content-Type-Options

## 性能优化

### 前端优化
- 代码分割和懒加载
- 静态资源CDN加速
- 图片懒加载
- Gzip压缩

### 后端优化
- 数据库查询优化
- Redis缓存（计划中）
- 连接池管理
- 异步处理

### 缓存策略
- 静态资源: 1年缓存
- API响应: 根据业务需求设置
- 数据库查询: 热点数据缓存

## 监控与日志

### 日志记录
- 访问日志: Nginx access.log
- 错误日志: Nginx error.log, Node.js应用日志
- 数据库慢查询日志

### 监控指标
- 服务器CPU和内存使用率
- 数据库连接数
- API响应时间
- 错误率统计

## 部署流程

### 环境要求
1. Node.js 16+
2. MySQL 8.0+
3. Nginx 1.20+
4. PM2全局安装

### 部署步骤
1. 代码拉取
2. 依赖安装
3. 环境变量配置
4. 数据库迁移
5. 前端构建
6. 服务启动
7. Nginx配置
8. 健康检查

## 备份策略
- 数据库: 每日自动备份
- 代码: Git仓库
- 配置文件: 定期备份
- 上传文件: 定期备份到OSS





