# 内网部署指南

## 方案概述

将班前学习监督系统部署到单位内网服务器，使用内网存储替代云存储。

## 部署方案

### 方案一：Node.js 服务器部署

#### 1. 服务器环境准备
```bash
# 安装 Node.js (推荐 v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 2. 项目部署
```bash
# 1. 上传项目文件到服务器
scp -r learning-platform/ user@your-server:/var/www/learning-platform/

# 2. 在服务器上安装依赖
cd /var/www/learning-platform
npm install

# 3. 构建项目
npm run build

# 4. 启动服务器
npm start
```

#### 3. 使用 PM2 管理进程
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "learning-platform"

# 设置开机自启
pm2 startup
pm2 save
```

### 方案二：Nginx 静态文件部署

#### 1. 安装 Nginx
```bash
sudo apt update
sudo apt install nginx
```

#### 2. 配置 Nginx
```bash
# 创建网站目录
sudo mkdir -p /var/www/learning-platform

# 上传构建文件
sudo cp -r dist/* /var/www/learning-platform/

# 配置 Nginx
sudo nano /etc/nginx/sites-available/learning-platform
```

#### 3. Nginx 配置文件
```nginx
server {
    listen 80;
    server_name your-server-ip;
    root /var/www/learning-platform;
    index index.html;

    # 支持 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

#### 4. 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/learning-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 内网存储配置

### 1. 修改存储配置
创建内网存储服务：

```javascript
// src/intranetStorage.ts
export class IntranetStorageService {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async uploadFile(file: File, path: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    const result = await response.json();
    return result.url;
  }

  async downloadFile(path: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/download?path=${encodeURIComponent(path)}`);
    
    if (!response.ok) {
      throw new Error('下载失败');
    }

    return response.blob();
  }

  async listFiles(directory: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/list?directory=${encodeURIComponent(directory)}`);
    
    if (!response.ok) {
      throw new Error('获取文件列表失败');
    }

    return response.json();
  }
}
```

### 2. 创建内网存储服务器
```javascript
// server/storage-server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3001;

// 配置存储目录
const STORAGE_DIR = '/var/storage/learning-platform';

// 确保存储目录存在
fs.mkdir(STORAGE_DIR, { recursive: true });

// 文件上传
const upload = multer({ dest: STORAGE_DIR });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { path: tempPath } = req.file;
    const { path: targetPath } = req.body;
    const finalPath = path.join(STORAGE_DIR, targetPath);

    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.rename(tempPath, finalPath);

    res.json({ 
      success: true, 
      url: `/download?path=${encodeURIComponent(targetPath)}` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 文件下载
app.get('/download', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const fullPath = path.join(STORAGE_DIR, filePath);
    
    if (!await fs.access(fullPath).then(() => true).catch(() => false)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.download(fullPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 文件列表
app.get('/list', async (req, res) => {
  try {
    const { directory } = req.query;
    const dirPath = path.join(STORAGE_DIR, directory || '');
    
    const files = await fs.readdir(dirPath);
    const fileList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          isDirectory: stats.isDirectory(),
          modified: stats.mtime
        };
      })
    );

    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`存储服务器运行在 http://localhost:${PORT}`);
});
```

## 部署脚本

### 1. 创建部署脚本
```bash
#!/bin/bash
# deploy.sh

echo "🚀 开始内网部署..."

# 构建项目
echo "构建项目..."
npm run build

# 创建部署包
echo "创建部署包..."
tar -czf learning-platform.tar.gz dist/ server.js package.json

# 上传到服务器
echo "上传到服务器..."
scp learning-platform.tar.gz user@your-server:/tmp/

# 在服务器上部署
ssh user@your-server << 'EOF'
cd /var/www
sudo rm -rf learning-platform
sudo mkdir learning-platform
cd learning-platform
sudo tar -xzf /tmp/learning-platform.tar.gz
sudo npm install --production
sudo pm2 restart learning-platform || sudo pm2 start server.js --name learning-platform
sudo rm /tmp/learning-platform.tar.gz
EOF

echo "✅ 部署完成！"
```

### 2. 设置权限
```bash
chmod +x deploy.sh
```

## 安全配置

### 1. 防火墙设置
```bash
# 只允许内网访问
sudo ufw allow from 192.168.0.0/16 to any port 3000
sudo ufw allow from 10.0.0.0/8 to any port 3000
```

### 2. SSL 证书（可选）
```bash
# 使用 Let's Encrypt 或自签名证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 监控和维护

### 1. 日志监控
```bash
# 查看应用日志
pm2 logs learning-platform

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 备份策略
```bash
# 创建备份脚本
#!/bin/bash
BACKUP_DIR="/backup/learning-platform"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /var/storage/learning-platform

# 保留最近 30 天的备份
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +30 -delete
```

## 访问地址

部署完成后，您可以通过以下地址访问：

- **内网地址**: `http://your-server-ip:3000`
- **域名访问**: `http://your-domain.com` (如果配置了域名)

## 注意事项

1. **数据安全**: 确保内网存储目录有适当的权限设置
2. **备份**: 定期备份重要数据
3. **监控**: 设置服务器监控和告警
4. **更新**: 定期更新系统和依赖包
5. **文档**: 维护部署和运维文档 