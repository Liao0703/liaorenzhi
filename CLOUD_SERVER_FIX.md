# 云服务器后端服务启动修复指南

## ✅ 本地测试成功
刚才测试确认代码没有问题，本地服务启动正常：
```json
{"status":"OK","timestamp":"2025-08-05T08:31:13.394Z","version":"1.0.0"}
```

## ❌ 云服务器问题
端口3001无法连接，说明云服务器上的服务没有正确启动。

## 🛠️ 立即修复步骤

### 1. SSH连接到服务器
```bash
ssh root@116.62.65.246
```

### 2. 检查当前状态
```bash
# 检查端口占用
netstat -tlnp | grep 3001
lsof -i :3001

# 检查Node.js进程
ps aux | grep node

# 如果有旧进程，先结束
pkill -f "node.*app.js"
```

### 3. 上传服务器代码
如果服务器上没有代码，需要先上传：

**方法A：使用scp上传**
```bash
# 在本地执行
scp -r server/ root@116.62.65.246:/opt/learning-platform/
```

**方法B：在服务器上直接创建**
```bash
# 在服务器上执行
mkdir -p /opt/learning-platform
cd /opt/learning-platform

# 手动创建或上传所有server目录的文件
```

### 4. 在服务器上配置环境
```bash
cd /opt/learning-platform

# 安装Node.js（如果需要）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 安装依赖
npm install

# 创建正确的环境配置
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=railway-learning-platform-super-secret-jwt-key-2024
CORS_ORIGIN=http://116.62.65.246:3000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
EOF

# 创建uploads目录
mkdir -p uploads
```

### 5. 启动服务
```bash
# 方法A：前台启动（用于调试）
node app.js

# 方法B：后台启动（推荐）
nohup node app.js > server.log 2>&1 &

# 查看进程
ps aux | grep node
```

### 6. 验证服务
```bash
# 在服务器上测试
curl http://localhost:3001/health

# 应该返回：
# {"status":"OK","timestamp":"...","version":"1.0.0"}
```

### 7. 外部访问测试
服务启动成功后，在本地测试：
```bash
curl http://116.62.65.246:3001/health
```

## 🔧 常见问题排查

### 问题1：端口被占用
```bash
lsof -i :3001
kill -9 <PID>
```

### 问题2：权限问题
```bash
chown -R root:root /opt/learning-platform
chmod +x /opt/learning-platform/app.js
```

### 问题3：防火墙问题
```bash
# Ubuntu/Debian
ufw allow 3001
ufw status

# CentOS/RHEL
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

### 问题4：查看错误日志
```bash
tail -f server.log
journalctl -u your-service-name -f
```

## 📋 快速部署脚本

如果你有SSH密钥配置，可以使用：
```bash
./deploy-to-server.sh
```

## 🎯 成功标志

服务正确启动后，前端应该：
- ✅ 不再显示"Failed to fetch"
- ✅ 维护管理面板正常工作
- ✅ 学习记录可以正常加载
- ✅ 服务器状态监控显示绿色

## 💡 生产环境建议

服务稳定运行后，建议：
```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start app.js --name learning-platform-api
pm2 startup
pm2 save
```