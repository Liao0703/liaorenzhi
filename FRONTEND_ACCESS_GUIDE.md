# 🌐 前端访问指南

## ✅ 正确访问地址
**http://localhost:5177/**

## 🔍 如果还是无法访问，请按以下顺序检查：

### 1. 确认地址正确
- ❌ http://localhost:5173 (错误)
- ❌ http://localhost:5178 (错误)  
- ✅ http://localhost:5177 (正确)

### 2. 清除浏览器缓存
- 按 `F12` 打开开发者工具
- 右键点击刷新按钮 → "强制刷新"
- 或使用无痕模式

### 3. 检查浏览器控制台
- 按 `F12` → Console 标签
- 查看是否有错误信息
- 如有401错误，执行：`localStorage.clear()`

### 4. 尝试其他浏览器
如果Chrome无法访问，尝试：
- Firefox
- Safari
- Edge

### 5. 检查网络连接
在终端运行：
```bash
curl http://localhost:5177
```

## 📊 服务器状态
- 前端服务器：✅ 运行在 5177 端口
- 后端API服务器：✅ 运行在 3001 端口
- 数据库：✅ 内存数据库正常

## 🔗 快速链接
- 前端：http://localhost:5177/
- API状态：http://localhost:3001/api/status
- 文章API：http://localhost:3001/api/articles
