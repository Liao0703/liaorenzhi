# 服务器启动指南

## 问题诊断

从截图可以看到：
- ✅ 阿里云ECS服务器正常运行
- ✅ 安全组已开放端口3000和3001
- ❌ **后端API服务未启动** ← 这是问题所在

## 快速解决方案

### 方案1：本地启动（测试用）

```bash
# 进入服务器目录
cd learning-platform/server

# 安装依赖
npm install

# 启动服务
npm start
```

### 方案2：部署到云服务器（推荐）

1. **给脚本添加执行权限**
```bash
chmod +x start-backend-server.sh
chmod +x deploy-to-server.sh
```

2. **自动部署到服务器**
```bash
./deploy-to-server.sh
```

### 方案3：手动部署到服务器

1. **SSH连接到服务器**
```bash
ssh root@116.62.65.246
```

2. **在服务器上执行**
```bash
# 创建项目目录
mkdir -p /opt/learning-platform
cd /opt/learning-platform

# 如果有Git仓库，克隆代码
# git clone your-repo-url .

# 或者手动上传server目录到这里

# 安装Node.js（如果未安装）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装项目依赖
npm install

# 创建环境变量文件
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=railway-learning-platform-super-secret-jwt-key-2024
CORS_ORIGIN=http://116.62.65.246:3000
EOF

# 启动服务（后台运行）
nohup node app.js > server.log 2>&1 &

# 检查服务状态
curl http://localhost:3001/health
```

## 验证服务状态

启动后，访问以下地址验证：

- 🔍 健康检查: http://116.62.65.246:3001/health
- 🌐 API基础地址: http://116.62.65.246:3001/api
- 📊 CORS测试: http://116.62.65.246:3001/api/cors-test

## 常见问题排查

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3001

# 结束占用进程
pkill -f "node.*app.js"
```

### 2. 防火墙问题
```bash
# Ubuntu/Debian
sudo ufw allow 3001

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### 3. 查看服务日志
```bash
# 查看实时日志
tail -f server.log

# 查看最近的错误
tail -50 server.log | grep -i error
```

### 4. 服务重启
```bash
# 停止服务
pkill -f "node.*app.js"

# 重新启动
nohup node app.js > server.log 2>&1 &
```

## 预期结果

服务启动成功后，前端页面应该：
- ✅ 不再显示"Failed to fetch"错误
- ✅ 维护管理功能正常工作
- ✅ 学习记录管理显示真实数据（如果数据库已配置）
- ✅ 服务器状态监控显示绿色状态

## 生产环境建议

1. **使用PM2管理进程**
```bash
npm install -g pm2
pm2 start app.js --name learning-platform-api
pm2 startup
pm2 save
```

2. **配置Nginx反向代理**（可选）
3. **设置SSL证书**（可选）
4. **配置日志轮转**