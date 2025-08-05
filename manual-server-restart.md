# 🛠️ 手动重启远程服务器Node.js服务指南

## 🚀 快速重启命令

### 1️⃣ SSH连接到服务器
```bash
ssh root@116.62.65.246
# 如果用户名不是root，请替换为实际用户名
```

### 2️⃣ 检查当前状态
```bash
# 查看Node.js进程
ps aux | grep node

# 查看3000端口占用
netstat -tlnp | grep 3000

# 查看PM2状态（如果使用PM2）
pm2 status
```

### 3️⃣ 停止现有服务
```bash
# 如果使用PM2
pm2 stop all
pm2 delete all

# 停止Node.js进程
pkill -f node

# 或者根据PID停止特定进程
kill -9 <PID>
```

### 4️⃣ 进入应用目录
```bash
# 常见的应用路径，根据实际情况调整
cd /root/learning-platform
# 或者
cd /var/www/learning-platform
# 或者
cd /opt/learning-platform

# 确认当前目录
pwd
ls -la
```

### 5️⃣ 启动服务
```bash
# 方法1: 使用PM2（推荐）
pm2 start server.js --name "learning-platform"
pm2 status

# 方法2: 使用npm start
npm start

# 方法3: 直接使用node（后台运行）
nohup node server.js > /tmp/app.log 2>&1 &

# 方法4: 使用screen（保持会话）
screen -S learning-platform
node server.js
# 按 Ctrl+A, 然后按 D 退出screen但保持运行
```

### 6️⃣ 验证服务
```bash
# 检查3000端口
netstat -tlnp | grep 3000

# 检查进程
ps aux | grep node

# 测试API
curl http://localhost:3000/
```

## 🔧 常见问题解决

### 问题1: 端口被占用
```bash
# 找到占用3000端口的进程
lsof -i :3000
# 停止占用进程
kill -9 <PID>
```

### 问题2: 依赖未安装
```bash
# 安装依赖
npm install
# 或者强制重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题3: 权限问题
```bash
# 修改文件权限
chmod +x server.js
# 或者使用sudo
sudo node server.js
```

### 问题4: 环境变量问题
```bash
# 设置NODE_ENV
export NODE_ENV=production
# 或者在启动时设置
NODE_ENV=production node server.js
```

## 📋 自动重启配置

### 使用PM2自动重启
```bash
# 安装PM2
npm install -g pm2

# 启动并配置自动重启
pm2 start server.js --name "learning-platform" --watch

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
# 按照提示执行生成的命令
```

### 使用systemd服务
```bash
# 创建服务文件
sudo nano /etc/systemd/system/learning-platform.service

# 服务文件内容：
[Unit]
Description=Learning Platform Node.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/learning-platform
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# 启用并启动服务
sudo systemctl enable learning-platform
sudo systemctl start learning-platform
sudo systemctl status learning-platform
```

## 🚨 紧急重启脚本
```bash
#!/bin/bash
# 保存为 emergency-restart.sh

echo "🚨 紧急重启Node.js服务..."

# 停止所有Node.js进程
pkill -f node
sleep 2

# 进入应用目录
cd /root/learning-platform || exit 1

# 启动服务
if command -v pm2 >/dev/null 2>&1; then
    pm2 start server.js --name "learning-platform"
else
    nohup node server.js > /tmp/app.log 2>&1 &
fi

echo "✅ 服务重启完成"
echo "📊 检查状态:"
netstat -tlnp | grep 3000
```

## 📞 联系信息
如果遇到问题，请检查：
1. 服务器磁盘空间: `df -h`
2. 内存使用情况: `free -h`
3. 应用日志: `tail -f /tmp/app.log`
4. 系统日志: `tail -f /var/log/syslog` 