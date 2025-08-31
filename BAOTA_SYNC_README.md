# 🚀 宝塔服务器同步指南

## 📋 同步内容

本次同步包含以下重要更新：

### ✨ **新增用户注册功能**
- 完整的用户注册API (`/api/auth/register`)
- 用户登录验证功能 (`/api/auth/login`)
- 内存数据存储（重启后清空，适合测试）
- 注册页面 (`register.html`)
- 密码加密和输入验证

### 📁 **同步文件清单**
- `server.cjs` - 更新的后端服务器（包含注册功能）
- `register.html` - 用户注册页面
- `dist/` - 前端构建文件
- `server/` - Node.js后端代码
- `package.json` - 项目依赖配置

## 🔧 使用方法

### 方法一：自动同步（推荐）
```bash
# 运行自动同步脚本
./sync-to-baota.sh
```

### 方法二：手动上传
1. 将以下文件上传到宝塔文件管理 `/www/wwwroot/learning-platform/`：
   - `server.cjs`
   - `register.html`  
   - `dist/` 目录
   - `package.json`

2. 在宝塔终端执行：
```bash
cd /www/wwwroot/learning-platform
chmod +x baota-start.sh
./baota-start.sh
```

## 🌐 访问地址

同步完成后，您可以访问：

- **网站首页**: `http://116.62.65.246`
- **用户注册**: `http://116.62.65.246/register.html`
- **API健康检查**: `http://116.62.65.246/health`
- **API状态**: `http://116.62.65.246/api/status`

## 🧪 功能测试

### 测试用户注册
1. 访问 `http://116.62.65.246/register.html`
2. 填写用户信息：
   - 用户名：至少3个字符
   - 密码：至少6个字符
   - 姓名：真实姓名
   - 其他字段可选
3. 点击"注册账号"
4. 注册成功后可立即登录

### API测试
```bash
# 在宝塔终端中测试
cd /www/wwwroot/learning-platform
./test-register.sh
```

## 🔧 管理命令

### 重启服务
```bash
ssh root@116.62.65.246 'cd /www/wwwroot/learning-platform && ./restart.sh'
```

### 查看服务状态
```bash
ssh root@116.62.65.246 'cd /www/wwwroot/learning-platform && ps aux | grep "node server.cjs"'
```

### 查看日志
```bash
ssh root@116.62.65.246 'cd /www/wwwroot/learning-platform && tail -f server.log'
```

## 📊 系统信息

- **服务器**: 116.62.65.246
- **端口**: 3000 (HTTP)
- **环境**: 生产环境
- **存储**: 内存存储（适合测试）
- **支持功能**: 用户注册、登录、密码加密

## 🚨 注意事项

1. **数据持久化**: 当前使用内存存储，服务器重启后用户数据会清空
2. **端口配置**: 确保防火墙已开放3000端口
3. **SSL证书**: 建议配置HTTPS以提高安全性
4. **数据备份**: 如需持久化，请升级到MySQL数据库

## 🔄 升级到数据库存储

如果需要永久存储用户数据，可以：

1. 在宝塔面板创建MySQL数据库
2. 修改 `server/.env` 配置文件
3. 将内存存储切换为数据库存储
4. 导入数据库表结构

## 📞 技术支持

如遇问题，请提供：
1. 错误截图
2. 服务器日志：`tail -f server.log`
3. API状态检查：`curl http://localhost:3000/health`
4. 浏览器开发者工具错误信息

---
**最后更新**: $(date)  
**版本**: v1.0 - 用户注册功能
