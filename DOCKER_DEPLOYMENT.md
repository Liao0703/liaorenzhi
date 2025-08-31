# 🐳 铁路学习平台 - Docker容器化部署指南

## 📋 概述

本文档介绍如何使用Docker和Docker Compose部署铁路学习平台。容器化部署具有以下优势：

- **环境一致性**: 开发、测试、生产环境完全一致
- **快速部署**: 一键启动完整技术栈
- **弹性扩展**: 支持水平扩展和负载均衡
- **资源隔离**: 容器间相互隔离，提高安全性
- **版本管理**: 镜像版本化，支持回滚

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx + Vue   │────│  Node.js API    │────│     MySQL       │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
│     Port: 80    │    │    Port: 3001   │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Redis      │
                    │     (Cache)     │
                    │    Port: 6379   │
                    └─────────────────┘
```

## 🔧 系统要求

### 硬件要求
- **CPU**: 2核或以上
- **内存**: 4GB或以上
- **磁盘**: 20GB可用空间

### 软件要求
- **Docker**: 20.10.0或以上
- **Docker Compose**: 2.0.0或以上
- **操作系统**: Linux/macOS/Windows (推荐Linux)

## ⚡ 快速开始

### 1. 克隆项目（如果需要）
```bash
git clone <repository-url>
cd learning-platform
```

### 2. 一键启动
```bash
./start.sh
```

快速启动脚本会自动：
- 检查Docker环境
- 创建配置文件
- 启动所有服务
- 等待服务就绪
- 显示访问地址

### 3. 访问应用

启动成功后，可以访问：

- **前端应用**: http://localhost
- **后端API**: http://localhost:3001
- **健康检查**: http://localhost:3001/health
- **API文档**: http://localhost:3001/api-docs
- **监控面板**: http://localhost:3001/monitoring

默认账号：
- **管理员**: admin / admin123456
- **演示用户**: demo / demo123456
- **维护用户**: maintenance / maintenance123456

## 🛠️ 手动部署

### 1. 环境准备

#### 检查Docker版本
```bash
docker --version
docker-compose --version
```

#### 创建配置文件
```bash
cp env.example .env
vim .env  # 编辑配置
```

### 2. 开发环境部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 生产环境部署

```bash
# 使用生产配置启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 或使用部署脚本
./docker/deploy.sh prod
```

### 4. 验证部署

```bash
# 检查所有服务状态
docker-compose ps

# 检查健康状态
curl http://localhost:3001/health

# 访问前端
curl http://localhost/
```

## 📦 服务详情

### Frontend (Nginx + Vue)
- **镜像**: learning-platform-frontend
- **端口**: 80
- **功能**: 
  - 静态文件服务
  - SPA路由支持
  - API代理
  - Gzip压缩
  - 安全头设置

### Backend (Node.js)
- **镜像**: learning-platform-backend  
- **端口**: 3001
- **功能**:
  - RESTful API
  - JWT认证
  - 文件上传
  - 监控告警
  - 缓存管理

### MySQL Database
- **镜像**: mysql:8.0
- **端口**: 3306
- **配置**:
  - 数据库: learning_platform
  - 用户: app_user
  - 自动初始化脚本

### Redis Cache
- **镜像**: redis:7-alpine
- **端口**: 6379
- **配置**:
  - 密码保护
  - 内存限制: 256MB (dev) / 2GB (prod)
  - 数据持久化

## 🌍 环境配置

### 开发环境 (dev)
- 默认配置
- 端口暴露到宿主机
- 开发友好的日志级别
- 数据卷映射便于调试

### 生产环境 (prod)
- 性能优化配置
- 资源限制
- 安全配置增强
- SSL/HTTPS支持
- 监控和日志收集

### 测试环境 (test)
- 轻量化配置
- 临时数据卷
- 快速启停

## 🔧 高级配置

### 环境变量详解

```bash
# 应用配置
NODE_ENV=production
APP_NAME=铁路学习平台

# 数据库配置
MYSQL_ROOT_PASSWORD=secure-root-password
MYSQL_DATABASE=learning_platform
MYSQL_USER=app_user
MYSQL_PASSWORD=secure-app-password

# Redis配置
REDIS_PASSWORD=secure-redis-password

# JWT配置
JWT_SECRET=your-super-secure-jwt-secret

# 邮件配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@company.com
SMTP_PASS=email-password
SMTP_FROM=系统通知 <system@company.com>

# 告警配置
ALERT_WEBHOOK_URL=https://hooks.example.com/webhook

# OSS配置（可选）
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=your-bucket-name
```

### 数据卷管理

```bash
# 查看数据卷
docker volume ls

# 备份数据卷
docker run --rm -v learning-platform-mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v learning-platform-mysql-data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql-backup.tar.gz -C /data
```

### 网络配置

```bash
# 查看网络
docker network ls

# 检查网络详情
docker network inspect learning-platform-network
```

## 🎯 运维管理

### 日常操作

```bash
# 查看服务状态
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f [service-name]

# 重启服务
docker-compose restart [service-name]

# 更新服务
docker-compose pull
docker-compose up -d

# 进入容器
docker-compose exec [service-name] /bin/sh
```

### 监控和维护

```bash
# 查看系统监控
curl http://localhost:3001/api/monitoring/summary

# 查看缓存状态
curl http://localhost:3001/api/cache/stats

# 查看告警信息
curl http://localhost:3001/api/monitoring/alerts

# 清理系统
docker system prune -f
docker volume prune -f
```

### 故障排查

#### 服务无法启动
```bash
# 查看详细日志
docker-compose logs [service-name]

# 检查配置文件
docker-compose config

# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :3001
```

#### 数据库连接问题
```bash
# 检查MySQL状态
docker-compose exec mysql mysqladmin ping

# 进入MySQL容器
docker-compose exec mysql mysql -u root -p

# 检查数据库连接
docker-compose exec backend node -e "const { pool } = require('./config/database'); pool.execute('SELECT 1').then(() => console.log('OK')).catch(console.error)"
```

#### 缓存连接问题
```bash
# 检查Redis状态
docker-compose exec redis redis-cli ping

# 查看Redis信息
docker-compose exec redis redis-cli info
```

## 🔒 安全配置

### 生产环境安全检查

1. **更改默认密码**
   ```bash
   # 修改.env文件中的所有密码
   MYSQL_ROOT_PASSWORD=strong-password
   MYSQL_PASSWORD=strong-password  
   REDIS_PASSWORD=strong-password
   JWT_SECRET=very-long-secure-secret
   ```

2. **SSL/HTTPS配置**
   ```bash
   # 获取SSL证书
   certbot certonly --standalone -d your-domain.com
   
   # 更新nginx配置
   cp docker/nginx.prod.conf docker/nginx.conf
   ```

3. **防火墙配置**
   ```bash
   # 只开放必要端口
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw deny 3306/tcp  # 数据库不对外开放
   ufw deny 6379/tcp  # Redis不对外开放
   ```

4. **访问控制**
   - 设置API文档访问密码
   - 配置监控面板访问限制
   - 启用操作日志审计

## 📊 性能优化

### 数据库优化
```sql
-- MySQL配置优化
SET GLOBAL innodb_buffer_pool_size = 1073741824;  -- 1GB
SET GLOBAL max_connections = 1000;
SET GLOBAL query_cache_size = 268435456;  -- 256MB
```

### 缓存优化
```bash
# Redis内存优化
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 应用优化
- 启用Gzip压缩
- 配置静态资源缓存
- 开启API响应缓存
- 优化数据库查询

## 🔄 更新和维护

### 应用更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 滚动更新
docker-compose up -d
```

### 数据库迁移
```bash
# 执行数据库迁移脚本
docker-compose exec mysql mysql -u app_user -p learning_platform < migration.sql
```

### 备份策略
```bash
# 数据库备份
docker-compose exec mysql mysqldump -u root -p learning_platform > backup_$(date +%Y%m%d).sql

# 文件备份
tar czf uploads_backup_$(date +%Y%m%d).tar.gz data/uploads/

# 配置备份
cp .env env_backup_$(date +%Y%m%d)
```

## 🆘 问题解答

### 常见问题

**Q: 容器启动失败怎么办？**
A: 
1. 检查日志：`docker-compose logs [service-name]`
2. 检查端口占用：`netstat -tulpn | grep :[port]`
3. 检查磁盘空间：`df -h`
4. 检查内存使用：`free -h`

**Q: 数据丢失怎么办？**
A: 数据存储在Docker数据卷中，容器重启不会丢失数据。如需恢复，请使用备份文件。

**Q: 如何扩展服务？**
A: 修改docker-compose.yml中的replicas配置，或使用Docker Swarm进行集群部署。

**Q: 如何自定义配置？**
A: 修改.env文件中的环境变量，或直接修改docker-compose配置文件。

### 技术支持

如遇到问题，请：
1. 查看本文档的故障排查部分
2. 检查GitHub Issues
3. 联系技术支持团队

## 📚 参考资料

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [MySQL Docker镜像](https://hub.docker.com/_/mysql)
- [Redis Docker镜像](https://hub.docker.com/_/redis)
- [Nginx Docker镜像](https://hub.docker.com/_/nginx)

---

**版本**: v1.0.0  
**更新时间**: 2025年1月19日  
**维护团队**: 铁路学习平台开发组
