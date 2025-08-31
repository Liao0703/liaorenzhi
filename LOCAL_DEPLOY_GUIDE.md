# 本地测试环境部署指南

## 🚀 快速开始

由于您在本地连接云数据库，需要通过API服务器来执行数据库操作。

## 📋 部署步骤

### 1. 创建数据库表（通过服务器执行）

由于本地无法直接连接阿里云RDS，需要通过服务器来创建数据库表：

```bash
# 方法1：通过SSH隧道（推荐）
ssh root@116.62.65.246 << 'EOF'
cd /tmp
cat > create-stats-tables.sql << 'SQLEOF'
-- 将 create-overview-statistics-tables.sql 的内容复制到这里
SQLEOF

# 执行SQL（请替换为实际的数据库配置）
mysql -h your-rds-host -u your-user -p'your-password' your-database < create-stats-tables.sql
EOF
```

### 2. 更新本地后端代码

确保您的本地 `server/app.js` 已添加新路由：

```javascript
app.use('/api/overview-statistics', require('./routes/overview-statistics'));
```

### 3. 安装缺失的依赖（如果需要）

```bash
cd server
npm install node-cache
```

### 4. 重启本地后端服务

```bash
# 如果使用 npm start
npm start

# 如果使用 nodemon
npm run dev

# 如果使用 pm2
pm2 restart server
```

### 5. 测试新功能

1. **访问测试页面**：
   ```
   http://localhost:5175/test-overview-statistics.html
   ```

2. **或直接访问管理员面板**：
   ```
   http://localhost:5175/
   ```
   - 使用管理员账号登录
   - 点击"管理后台"进入
   - 查看概览页面的数据

## 🧪 验证步骤

### 1. 检查API是否正常

```bash
# 登录获取token
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用token测试统计接口
curl http://localhost:3002/api/overview-statistics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 检查数据库表是否创建

通过服务器检查：
```bash
ssh root@116.62.65.246
mysql -h your-rds-host -u your-user -p
USE your-database;
SHOW TABLES LIKE '%statistics%';
SHOW TABLES LIKE '%learning_records%';
SHOW TABLES LIKE '%activities%';
```

## ⚠️ 常见问题

### 1. API 404错误
- 检查是否添加了新路由到 app.js
- 确认路由文件存在：`server/routes/overview-statistics.js`

### 2. 数据库连接错误
- 确认云数据库允许本地IP连接
- 检查数据库配置是否正确

### 3. 缓存依赖缺失
- 运行 `npm install node-cache`

### 4. 数据为空
- 执行SQL脚本中的测试数据插入部分
- 或手动创建一些学习记录

## 📊 预期效果

成功部署后，您应该能看到：
- 实时的用户统计数据
- 最近的学习活动
- 学习排行榜
- 部门/工种统计图表

所有数据都来自云数据库，而不是模拟数据。
