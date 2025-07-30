# Vercel 部署指南

## 问题解决

### 错误：Could not resolve entry module "index.html"

这个错误通常出现在 Vercel 无法找到正确的入口文件时。我们已经通过以下方式解决了这个问题：

1. **确保 index.html 在正确位置**
   - `index.html` 必须在项目根目录
   - 文件路径：`learning-platform/index.html`

2. **简化 vercel.json 配置**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist"
   }
   ```

3. **简化 vite.config.ts**
   - 移除了复杂的路径解析
   - 使用默认的入口文件配置

## 部署步骤

### 1. 本地测试
```bash
# 确保依赖已安装
npm install

# 测试构建
npm run build

# 检查 dist 目录
ls -la dist/
```

### 2. 提交代码
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### 3. Vercel 部署

#### 方法一：Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

#### 方法二：GitHub 集成
1. 在 Vercel 控制台创建新项目
2. 连接 GitHub 仓库
3. 设置构建设置：
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 4. 环境变量（可选）
如果需要配置 OSS，在 Vercel 项目设置中添加：
- `VITE_OSS_ACCESS_KEY_ID`
- `VITE_OSS_ACCESS_KEY_SECRET`
- `VITE_OSS_BUCKET`
- `VITE_OSS_REGION`
- `VITE_OSS_ENDPOINT`

## 故障排除

### 构建失败
1. **检查文件结构**
   ```
   learning-platform/
   ├── index.html          ✅ 必须存在
   ├── package.json        ✅ 必须存在
   ├── vite.config.ts      ✅ 必须存在
   ├── src/
   │   └── main.tsx       ✅ 必须存在
   └── vercel.json        ✅ 必须存在
   ```

2. **清理缓存**
   ```bash
   # 清理本地缓存
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **检查 Vercel 日志**
   - 在 Vercel 控制台查看构建日志
   - 确认错误信息

### 常见问题

#### 问题：找不到模块
**解决方案**：确保所有依赖都在 `package.json` 中正确声明

#### 问题：端口冲突
**解决方案**：本地开发时使用不同端口
```bash
npm run dev -- --port 3000
```

#### 问题：构建超时
**解决方案**：优化构建配置，减少依赖大小

## 项目验证

部署成功后，检查以下功能：
- ✅ 页面正常加载
- ✅ 路由正常工作
- ✅ 文章列表显示
- ✅ 登录功能正常
- ✅ 文件上传功能
- ✅ 摄像头监控功能
- ✅ 数据导出功能

## 技术栈确认

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **部署平台**: Vercel
- **存储**: LocalStorage + 阿里云 OSS
- **路由**: React Router DOM
- **UI**: 原生 CSS + 响应式设计 