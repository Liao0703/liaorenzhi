# 🚀 学习平台展示访问指南

## 📋 服务器状态
- ✅ **前端开发服务器**: http://localhost:5173  
- ✅ **后端API服务器**: http://localhost:3001  
- ✅ **健康检查**: http://localhost:3001/health

## 🌐 访问方式

### 本地展示（推荐）
1. 打开浏览器
2. 访问：`http://localhost:5173`
3. 所有功能完全可用，连接本地API服务器

### 测试账号
- 管理员账号：admin / 密码：请查看数据库或使用注册功能
- 维护账号：maintenance / 密码：请查看相关配置

## 🔧 服务器管理

### 停止服务器
```bash
# 停止前端服务器
# 在运行npm run dev的终端中按 Ctrl+C

# 停止后端API服务器
pkill -f "node app.js"
```

### 重启服务器
```bash
# 启动后端API服务器
./start-local-api.sh

# 启动前端开发服务器
npm run dev
```

## 💡 优势
- 🚀 快速响应，无网络延迟
- 🔒 数据安全，本地运行
- 🛠️ 可以实时调试和修改
- 📱 完整功能展示

---
**注意**: 展示完成后，如需恢复云服务器连接，请修改 `src/config/api.ts` 中的API地址。