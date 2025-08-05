# 云服务器部署指南

## 快速启动

### 方法一：使用生产启动脚本（推荐）

```bash
# 给脚本执行权限
chmod +x start-production.sh

# 启动生产服务器
./start-production.sh
```

### 方法二：手动启动

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 启动服务器
npm start
```

### 方法三：使用 PM2（推荐用于生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "learning-platform"

# 查看状态
pm2 status

# 查看日志
pm2 logs learning-platform

# 重启应用
pm2 restart learning-platform

# 停止应用
pm2 stop learning-platform
```

## 环境变量配置

### 设置端口
```bash
# 设置自定义端口
export PORT=8080
npm start
```

### 设置环境
```bash
# 生产环境
export NODE_ENV=production
npm start
```

## 常见问题解决

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
```

### 2. 权限问题
```bash
# 给脚本执行权限
chmod +x *.sh

# 如果使用 PM2，确保有足够权限
sudo npm install -g pm2
```

### 3. 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 4. 检查服务状态
```bash
# 健康检查
curl http://localhost:3000/health

# API 状态检查
curl http://localhost:3000/api/status
```

## 部署检查清单

- [ ] Node.js 已安装（推荐 v18+）
- [ ] 项目依赖已安装 (`npm install`)
- [ ] 项目已构建 (`npm run build`)
- [ ] 端口已开放（默认 3000）
- [ ] 防火墙已配置
- [ ] 服务器可以访问

## 监控和维护

### 查看日志
```bash
# 如果使用 PM2
pm2 logs learning-platform

# 直接运行时的日志
npm start 2>&1 | tee app.log
```

### 性能监控
```bash
# 使用 PM2 监控
pm2 monit

# 查看系统资源
htop
```

## 故障排除

### 服务器无法启动
1. 检查 Node.js 版本：`node --version`
2. 检查依赖：`npm list`
3. 检查端口占用：`lsof -i :3000`
4. 查看错误日志

### 静态文件无法加载
1. 确认 `dist` 目录存在
2. 检查文件权限
3. 确认构建成功

### 网络访问问题
1. 检查防火墙设置
2. 确认服务器监听 `0.0.0.0`
3. 检查云服务器安全组设置 