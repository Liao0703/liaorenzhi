# 部署到 Vercel 说明

## 项目结构
```
learning-platform/
├── index.html          # 入口 HTML 文件
├── src/               # 源代码目录
├── public/            # 静态资源目录
├── package.json       # 项目配置
├── vite.config.ts     # Vite 配置
├── vercel.json        # Vercel 部署配置
└── tsconfig.json      # TypeScript 配置
```

## 部署步骤

### 1. 准备项目
确保项目根目录包含以下文件：
- `index.html` - 入口文件
- `package.json` - 项目配置
- `vite.config.ts` - Vite 配置
- `vercel.json` - Vercel 配置

### 2. 本地测试构建
```bash
npm install
npm run build
```

### 3. 部署到 Vercel

#### 方法一：通过 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 生产环境部署
vercel --prod
```

#### 方法二：通过 GitHub 集成
1. 将代码推送到 GitHub 仓库
2. 在 Vercel 控制台创建新项目
3. 连接 GitHub 仓库
4. 自动部署

### 4. 环境变量配置
如果需要配置环境变量，在 Vercel 控制台的项目设置中添加：
- `VITE_OSS_ACCESS_KEY_ID` - 阿里云 OSS Access Key ID
- `VITE_OSS_ACCESS_KEY_SECRET` - 阿里云 OSS Access Key Secret
- `VITE_OSS_BUCKET` - OSS Bucket 名称
- `VITE_OSS_REGION` - OSS 地域
- `VITE_OSS_ENDPOINT` - OSS 访问域名

## 故障排除

### 构建失败：找不到 index.html
- 确保 `index.html` 文件在项目根目录
- 检查 `vite.config.ts` 中的入口配置
- 验证 `vercel.json` 配置正确

### 端口冲突
如果本地开发时遇到端口冲突：
```bash
# 查找占用端口的进程
lsof -ti:5173

# 终止进程
kill -9 <PID>

# 或使用不同端口
npm run dev -- --port 3000
```

### 依赖问题
如果遇到依赖相关错误：
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## 项目特性
- ✅ React 18 + TypeScript
- ✅ Vite 构建工具
- ✅ 响应式设计
- ✅ 本地存储 + 云存储
- ✅ 摄像头监控
- ✅ Excel 数据导出
- ✅ 学习进度跟踪

## 技术栈
- **前端框架**: React 19
- **构建工具**: Vite 7
- **语言**: TypeScript
- **路由**: React Router DOM
- **UI 组件**: 原生 CSS + 响应式设计
- **数据存储**: LocalStorage + 阿里云 OSS
- **文件处理**: PDF.js, Mammoth.js
- **数据导出**: SheetJS (XLSX) 