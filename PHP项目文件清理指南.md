# PHP项目文件清理指南 - 47.109.142.72

## 🗂️ 项目文件分类

### ✅ **需要保留的核心文件**

#### PHP后端文件（完整保留）
```
php-backend/                     # 完整PHP后端目录
├── public/                      # Web根目录
│   ├── index.php               # 入口文件
│   ├── .htaccess               # Apache重写规则
│   └── test-api.html           # API测试页面
├── src/                        # PHP应用源码
├── config/                     # 配置文件
├── vendor/                     # Composer依赖（服务器生成）
├── composer.json               # 依赖配置
├── composer.lock               # 版本锁定
├── .env.example                # 环境配置示例
└── deploy-to-baota.sh          # 原PHP部署脚本
```

#### 新增配置文件（刚创建）
```
宝塔PHP项目部署指南.md          # 详细部署指南
nginx-php-baota.conf            # PHP专用Nginx配置
deploy-baota-php.sh             # 一键部署脚本
PHP项目文件清理指南.md          # 本文件
```

#### 数据库文件
```
server/init.sql                 # 数据库初始化脚本
```

#### 前端源码（本地构建用）
```
src/                            # React源码（已更新API配置）
public/                         # 静态资源
package.json                    # 前端依赖配置
vite.config.ts                  # 已更新为PHP后端配置
tsconfig.*.json                 # TypeScript配置
```

### ❌ **可以删除的文件**

#### Node.js后端相关（不需要）
```
server/                         # 整个Node.js后端目录
├── app.js                     
├── routes/
├── config/
├── package.json               # Node.js后端依赖
├── node_modules/              # Node.js依赖
└── ...

ecosystem.config.js             # PM2配置
server-baota.js                # Node.js版本的服务器文件
server.cjs                     # Node.js服务器文件
```

#### Node.js版本的配置文件
```
nginx-baota.conf               # Node.js版Nginx配置
宝塔快速部署指南.md            # Node.js版部署指南
```

#### 开发和测试文件
```
node_modules/                  # 前端Node依赖（服务器不需要）
dist/                          # 构建产物（会重新生成）
uploads/                       # 测试上传文件
.git/                          # Git历史（可选删除）
```

#### 文档和临时文件
```
*.md文档（除新建的部署指南外）
README.md
各种部署指南（除PHP版本外）
test-*.html                    # 测试文件
debug-*.html                   # 调试文件
```

#### 部署脚本（旧版本）
```
deploy*.sh（除deploy-baota-php.sh外）
start*.sh
sync*.sh
fix*.sh
```

---

## 🧹 清理步骤

### 第一步：备份重要文件
```bash
# 创建备份目录
mkdir -p backup-$(date +%Y%m%d)

# 备份重要配置
cp -r php-backend backup-$(date +%Y%m%d)/
cp server/init.sql backup-$(date +%Y%m%d)/
cp -r src backup-$(date +%Y%m%d)/
cp package.json vite.config.ts backup-$(date +%Y%m%d)/
```

### 第二步：删除Node.js后端
```bash
# 删除整个Node.js后端目录
rm -rf server/

# 删除Node.js相关配置
rm -f ecosystem.config.js
rm -f server-baota.js
rm -f server.cjs
```

### 第三步：删除旧配置文件
```bash
# 删除Node.js版本配置
rm -f nginx-baota.conf
rm -f 宝塔快速部署指南.md

# 删除测试和开发文件
rm -rf uploads/
rm -rf node_modules/
rm -rf dist/
```

### 第四步：删除文档文件（可选）
```bash
# 保留新创建的PHP部署相关文档，删除其他
find . -name "*.md" -not -name "*PHP*" -not -name "PHP*" -delete

# 或者选择性删除
rm -f README.md
rm -f DEPLOYMENT*.md
rm -f *GUIDE*.md
```

### 第五步：删除旧部署脚本
```bash
# 删除旧的部署脚本（保留新的deploy-baota-php.sh）
find . -name "deploy*.sh" -not -name "deploy-baota-php.sh" -delete
find . -name "start*.sh" -delete
find . -name "sync*.sh" -delete
find . -name "fix*.sh" -delete
```

---

## 📦 清理后的目录结构

```
learning-platform/
├── php-backend/                # PHP后端（完整）
│   ├── public/
│   ├── src/
│   ├── config/
│   ├── composer.json
│   └── ...
├── src/                        # React前端源码
├── public/                     # 静态资源
├── package.json                # 前端构建依赖
├── vite.config.ts             # 构建配置（已更新）
├── deploy-baota-php.sh        # PHP部署脚本
├── nginx-php-baota.conf       # PHP版Nginx配置
├── 宝塔PHP项目部署指南.md      # 部署指南
└── PHP项目文件清理指南.md      # 本文件
```

---

## ⚠️ 注意事项

1. **备份重要数据**: 清理前务必备份重要文件
2. **测试环境**: 建议先在测试环境执行清理
3. **分步执行**: 不要一次性删除所有文件，分步骤验证
4. **保留.env**: 如果已有配置好的.env文件，记得备份
5. **Git管理**: 如果使用Git，考虑保留.git目录

---

## 🚀 清理后的部署流程

1. **上传核心文件到服务器**:
   - `php-backend/` → `/www/wwwroot/47.109.142.72/php-backend/`
   - `nginx-php-baota.conf` → Nginx配置目录

2. **本地构建前端**:
   ```bash
   npm install
   npm run build
   # 上传生成的dist/目录
   ```

3. **运行部署脚本**:
   ```bash
   chmod +x deploy-baota-php.sh
   ./deploy-baota-php.sh
   ```

4. **配置数据库**: 按部署指南完成数据库设置

---

## 📞 清理后如遇问题

1. **缺少文件**: 从备份目录恢复
2. **配置错误**: 检查新的配置文件
3. **权限问题**: 确保文件权限正确设置
4. **服务异常**: 查看PHP和Nginx错误日志

清理完成后，项目结构会更加清晰，只保留PHP项目必需的文件。
