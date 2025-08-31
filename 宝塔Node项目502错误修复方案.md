# 🚨 宝塔Node项目502错误完整修复方案

## 🔍 502错误根本原因分析

从宝塔面板截图和配置文件分析，发现关键问题：

### ❌ 问题根源：端口配置不匹配
- **nginx代理端口**: 可能配置为3000端口
- **Node应用实际运行端口**: 3001端口 (根据ecosystem.config.js)
- **结果**: nginx无法连接到Node应用 → 502 Bad Gateway

## 🛠️ 完整修复步骤

### 第一步：确认Node应用端口

**检查当前Node应用监听的端口**：
1. 在宝塔面板 → Node项目 → learning_platform → 查看"项目配置"
2. 或SSH连接服务器检查：
```bash
# 检查Node进程端口
netstat -tulpn | grep 141605
# 或者
lsof -i :3000
lsof -i :3001
```

### 第二步：统一端口配置

**方案A：修改Node应用使用3000端口（推荐）**

1. **修改宝塔Node项目配置**：
   - 进入宝塔面板 → Node项目 → learning_platform
   - 点击"设置" → "项目配置"
   - 修改环境变量：`PORT=3000`

2. **或者修改ecosystem.config.js**：
```javascript
module.exports = {
  apps: [{
    name: 'learning-platform-server',
    script: './server/app.js',
    cwd: '/www/wwwroot/learning-platform',
    env: {
      NODE_ENV: 'production',
      PORT: '3000'  // 改为3000
    },
    instances: 1,
    exec_mode: 'fork',
    // ... 其他配置保持不变
  }]
};
```

**方案B：修改nginx代理到3001端口**

修改nginx配置文件，将代理端口改为3001：
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;  # 改为3001
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### 第三步：检查环境变量配置

确保宝塔服务器上有正确的环境变量：

1. **检查.env文件是否存在**：
```bash
ls -la /www/wwwroot/learning-platform/env.cloud
ls -la /www/wwwroot/learning-platform/.env
```

2. **创建或更新.env文件**：
```bash
cat > /www/wwwroot/learning-platform/.env << 'EOF'
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-learning-platform-2025
EOF
```

### 第四步：重启Node应用

在宝塔面板中：
1. **Node项目** → **learning_platform** 
2. 点击"**停止**"
3. 等待几秒后点击"**启动**"
4. 查看"**运行状态**"确保显示"运行中"

### 第五步：检查nginx配置

确保nginx正确配置了反向代理：

```nginx
server {
    listen 80;
    server_name 47.109.142.72;
    root /www/wwwroot/learning-platform;
    index index.html;

    # 前端静态文件
    location / {
        root /www/wwwroot/learning-platform/dist;
        try_files $uri $uri/ /index.html;
        
        # 修复MIME类型
        location ~* \.js$ {
            add_header Content-Type "text/javascript; charset=UTF-8";
        }
    }

    # API请求代理到Node后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000;  # 确保端口正确
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 第六步：验证修复结果

1. **检查Node进程**：
```bash
ps aux | grep node
netstat -tulpn | grep :3000
```

2. **测试API接口**：
```bash
curl -X POST http://47.109.142.72/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

3. **检查前端访问**：
   访问 `http://47.109.142.72` 确保页面正常加载

## 🔧 故障排查

### 如果仍然502错误：

1. **检查Node应用日志**：
```bash
# 在宝塔面板查看项目日志
# 或者直接查看日志文件
tail -f /www/wwwroot/learning-platform/logs/combined.log
tail -f /www/wwwroot/learning-platform/logs/err.log
```

2. **检查nginx错误日志**：
```bash
tail -f /www/wwwlogs/47.109.142.72.error.log
```

3. **手动测试Node应用**：
```bash
cd /www/wwwroot/learning-platform
node server/app.js
```

4. **检查依赖安装**：
```bash
cd /www/wwwroot/learning-platform
npm install --production
```

### 常见端口冲突解决

如果3000端口被占用：
```bash
# 查看端口占用
lsof -i :3000
# 终止占用进程
kill -9 PID号
```

## ✅ 修复验证清单

- [ ] Node应用在正确端口运行 (3000或3001)
- [ ] nginx代理配置匹配Node应用端口
- [ ] 环境变量正确设置
- [ ] 数据库连接正常
- [ ] API接口返回正确响应
- [ ] 前端页面正常加载
- [ ] 登录功能正常工作

完成以上步骤后，宝塔Node项目的502错误应该彻底解决！

## 📋 快速修复命令

```bash
# SSH连接到服务器后执行
cd /www/wwwroot/learning-platform

# 1. 确保环境变量文件存在
cp env.cloud .env

# 2. 安装依赖
npm install --production

# 3. 检查端口占用
netstat -tulpn | grep :3000

# 4. 重启nginx
nginx -t && nginx -s reload
```

然后在宝塔面板重启Node项目即可。



