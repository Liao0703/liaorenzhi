# 后端部署指南

本指南提供了完整的后端部署步骤，将 **铁路职工学习平台** 后端部署到 Ubuntu 服务器上，包括 Nginx 反向代理、HTTPS 证书和 Node.js 常驻服务。

## 🎯 部署目标

- **域名**: `api.liaorenzhi.top`
- **技术栈**: Nginx + HTTPS (Let's Encrypt) + Node.js + PM2
- **适用系统**: Ubuntu 20.04/22.04

## 📋 前置要求

1. **服务器准备**
   - Ubuntu 20.04/22.04 服务器
   - 具有 sudo 权限的用户
   - 服务器公网 IP（如：116.62.65.246）

2. **域名配置**
   - 确保 `api.liaorenzhi.top` 已指向服务器 IP
   - 放通 80/443 端口（云厂商安全组 + 服务器防火墙）

3. **项目文件**
   - 项目代码已上传到服务器
   - 项目目录包含完整的 `server/` 后端代码

## 🚀 快速部署

### 方式一：一键自动部署（推荐）

```bash
# 进入项目目录
cd /path/to/learning-platform

# 执行完整部署
bash deploy-backend-complete.sh
```

### 方式二：分步执行

按顺序执行以下脚本：

```bash
# 第0步：DNS与端口确认
bash deploy-step0-dns-ports.sh

# 第1步：安装Nginx
bash deploy-step1-nginx.sh

# 第2步：启动Node后端
bash deploy-step2-node-backend.sh

# 第3步：配置Nginx反向代理
bash deploy-step3-nginx-proxy.sh

# 🔍 中间验证（重要）
# 执行以下命令确认前面步骤都正常：
dig +short api.liaorenzhi.top
curl -s http://127.0.0.1:3001/health
curl -I http://api.liaorenzhi.top
curl -s http://api.liaorenzhi.top/health

# 第4步：申请HTTPS证书（需要输入邮箱）
bash deploy-step4-https-cert.sh

# 第5步：自动续期检查
bash deploy-step5-auto-renew.sh

# 第6步：PM2常驻服务
bash deploy-step6-pm2-daemon.sh
```

## 📂 部署脚本说明

| 脚本文件 | 功能说明 | 交互需求 |
|---------|---------|---------|
| `deploy-step0-dns-ports.sh` | DNS解析确认和端口配置 | 无 |
| `deploy-step1-nginx.sh` | 安装和配置Nginx | 无 |
| `deploy-step2-node-backend.sh` | 启动Node.js后端服务 | 无 |
| `deploy-step3-nginx-proxy.sh` | 配置Nginx反向代理 | 无 |
| `deploy-step4-https-cert.sh` | 申请HTTPS证书 | **需要输入邮箱** |
| `deploy-step5-auto-renew.sh` | 配置证书自动续期 | 无 |
| `deploy-step6-pm2-daemon.sh` | 配置PM2常驻服务 | 无 |
| `deploy-backend-complete.sh` | 完整自动部署脚本 | 选择模式 |

## 🔧 验证部署

部署完成后，执行以下命令验证：

```bash
# 1. 检查HTTPS访问
curl -I https://api.liaorenzhi.top

# 2. 健康检查
curl -s https://api.liaorenzhi.top/health

# 3. CORS测试
curl -s https://api.liaorenzhi.top/api/cors-test

# 4. PM2状态
pm2 status

# 5. 证书状态
sudo certbot certificates
```

期望结果：
- HTTPS访问返回 200 OK
- 健康检查返回 JSON 响应
- PM2 显示应用在线
- 证书有效期 > 60天

## 🛠️ 管理命令

### PM2 进程管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs learning-api

# 重启应用
pm2 restart learning-api

# 停止应用
pm2 stop learning-api

# 删除应用
pm2 delete learning-api

# 监控界面
pm2 monit

# 使用管理脚本
bash server/pm2-manage.sh status
```

### Nginx 管理

```bash
# 检查状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx

# 重载配置
sudo systemctl reload nginx

# 测试配置
sudo nginx -t

# 查看访问日志
sudo tail -f /var/log/nginx/api.liaorenzhi.top.access.log

# 查看错误日志
sudo tail -f /var/log/nginx/api.liaorenzhi.top.error.log
```

### SSL证书管理

```bash
# 查看证书状态
sudo certbot certificates

# 测试续期
sudo certbot renew --dry-run

# 强制续期
sudo certbot renew --force-renewal

# 手动续期
bash manual-renew-cert.sh

# 证书状态检查
bash check-cert-status.sh
```

## 📁 重要文件位置

### 配置文件
- **Nginx配置**: `/etc/nginx/sites-available/api.liaorenzhi.top`
- **PM2配置**: `./server/ecosystem.config.js`
- **环境变量**: `./server/.env`

### 日志文件
- **Nginx访问日志**: `/var/log/nginx/api.liaorenzhi.top.access.log`
- **Nginx错误日志**: `/var/log/nginx/api.liaorenzhi.top.error.log`
- **PM2应用日志**: `./server/logs/`
- **SSL证书日志**: `/var/log/letsencrypt/`

### 证书文件
- **证书目录**: `/etc/letsencrypt/live/api.liaorenzhi.top/`
- **私钥**: `privkey.pem`
- **证书**: `cert.pem`
- **证书链**: `chain.pem`
- **完整证书**: `fullchain.pem`

## 🔍 故障排除

### 常见问题

1. **DNS解析失败**
   ```bash
   # 检查DNS解析
   dig +short api.liaorenzhi.top
   nslookup api.liaorenzhi.top
   ```

2. **端口被占用**
   ```bash
   # 检查端口占用
   sudo ss -tulpn | grep :80
   sudo ss -tulpn | grep :443
   sudo ss -tulpn | grep :3001
   
   # 释放端口
   sudo fuser -k 80/tcp
   sudo fuser -k 3001/tcp
   ```

3. **Node.js应用启动失败**
   ```bash
   # 查看详细错误
   pm2 logs learning-api
   
   # 手动启动测试
   cd server
   node app.js
   ```

4. **HTTPS证书申请失败**
   ```bash
   # 检查Nginx配置
   sudo nginx -t
   
   # 检查域名解析
   curl -I http://api.liaorenzhi.top
   
   # 查看详细错误
   sudo certbot --nginx -d api.liaorenzhi.top --dry-run
   ```

5. **502 Bad Gateway错误**
   ```bash
   # 检查后端是否运行
   curl -s http://127.0.0.1:3001/health
   
   # 检查Nginx代理配置
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

### 日志查看

```bash
# 实时查看所有相关日志
sudo tail -f /var/log/nginx/api.liaorenzhi.top.access.log &
sudo tail -f /var/log/nginx/api.liaorenzhi.top.error.log &
pm2 logs learning-api --lines 20
```

## 🔄 更新部署

当代码更新时：

```bash
# 1. 更新代码
git pull origin main

# 2. 安装新依赖（如有）
cd server
npm install

# 3. 重启应用
pm2 restart learning-api

# 4. 验证更新
curl -s https://api.liaorenzhi.top/health
```

## 📊 监控建议

1. **设置监控报警**
   - 服务器资源监控
   - 应用健康检查
   - SSL证书过期提醒

2. **定期检查**
   - 每周检查PM2状态
   - 每月检查证书状态
   - 每季度检查日志大小

3. **备份策略**
   - 定期备份重要配置文件
   - 备份上传的文件
   - 备份数据库（如有）

## 🎉 部署完成

部署成功后，你的API服务将在以下地址可用：

- **主服务**: https://api.liaorenzhi.top
- **健康检查**: https://api.liaorenzhi.top/health
- **CORS测试**: https://api.liaorenzhi.top/api/cors-test

现在可以更新前端配置，将API地址指向 `https://api.liaorenzhi.top`，并测试所有功能。

---

如有问题，请检查：
1. 部署日志 `deployment-report.txt`
2. 相关日志文件
3. 按照故障排除步骤检查
