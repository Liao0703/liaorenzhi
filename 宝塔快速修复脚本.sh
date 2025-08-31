#!/bin/bash

# 🚀 宝塔Node.js项目快速修复脚本
# 适用于域名: 47.109.142.72

echo "🚀 开始修复宝塔Node.js项目配置..."
echo "=========================================="

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "✅ 在正确的项目目录中"

# 第一步：构建前端
echo "🔨 第一步：构建前端应用..."
if [ -d "node_modules" ]; then
    echo "检测到node_modules，开始构建..."
    npm run build
else
    echo "安装依赖并构建..."
    npm install
    npm run build
fi

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 前端构建失败，请检查构建配置"
    exit 1
fi

echo "✅ 前端构建成功"

# 第二步：检查服务器后端依赖
echo "📦 第二步：检查服务器后端依赖..."
cd server
if [ ! -d "node_modules" ]; then
    echo "安装服务器依赖..."
    npm install --production
fi
cd ..

echo "✅ 服务器依赖检查完成"

# 第三步：生成配置文件
echo "⚙️ 第三步：生成配置文件..."

# 生成.env模板
cat > .env.example << 'EOF'
NODE_ENV=production
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_USER=learning_platform
DB_PASSWORD=请设置数据库密码
DB_NAME=learning_platform

# JWT配置
JWT_SECRET=请设置JWT密钥
JWT_EXPIRES_IN=24h

# Redis配置 (可选)
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS配置
CORS_ORIGIN=http://47.109.142.72,https://47.109.142.72
EOF

echo "✅ 配置文件模板已生成"

# 第四步：检查关键文件
echo "🔍 第四步：检查关键文件..."

required_files=(
    "server/app.js"
    "dist/index.html"
    "package.json"
    "ecosystem.config.js"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "❌ 缺少关键文件:"
    printf ' - %s\n' "${missing_files[@]}"
    exit 1
fi

echo "✅ 关键文件检查通过"

# 第五步：生成上传指南
echo "📋 第五步：生成上传和配置指南..."

cat > 宝塔配置指南.txt << 'EOF'
🚀 宝塔Node.js项目配置指南

1. 【宝塔Node项目设置】
   - 项目类型: Node项目 
   - 项目目录: /www/wwwroot/learning-platform
   - 启动选项: start:server
   - Node版本: 18.x 或 20.x
   - 包管理器: npm

2. 【需要上传的文件】
   本地文件 → 服务器路径
   - server/ → /www/wwwroot/learning-platform/server/
   - dist/ → /www/wwwroot/learning-platform/dist/  
   - package.json → /www/wwwroot/learning-platform/package.json
   - ecosystem.config.js → /www/wwwroot/learning-platform/ecosystem.config.js
   - .env.example → /www/wwwroot/learning-platform/.env.example

3. 【创建环境变量】
   复制.env.example为.env，并修改:
   - 数据库密码
   - JWT密钥
   - 域名设置

4. 【创建数据库】
   - 数据库名: learning_platform
   - 用户名: learning_platform
   - 导入: server/init.sql

5. 【配置Nginx】
   网站设置 → 反向代理
   - 目标URL: http://127.0.0.1:3001
   - 发送域名: $host

6. 【启动项目】
   Node项目管理 → 点击"启动"

7. 【验证部署】
   - http://47.109.142.72 → 前端页面
   - http://47.109.142.72/health → API健康检查
   - http://47.109.142.72/api-docs → API文档

EOF

echo ""
echo "🎉 修复脚本执行完成！"
echo "=========================================="
echo "📋 接下来的步骤:"
echo "1. 查看生成的文件:"
echo "   - 宝塔配置指南.txt (详细配置步骤)"
echo "   - .env.example (环境变量模板)"
echo ""
echo "2. 上传文件到服务器:"
echo "   - server/ 目录"
echo "   - dist/ 目录" 
echo "   - package.json"
echo "   - ecosystem.config.js"
echo ""
echo "3. 按照'宝塔Node项目部署指南.md'完成配置"
echo ""
echo "📞 如遇问题，请检查:"
echo "- Node.js版本 >= 18.0"
echo "- 数据库连接配置"
echo "- 启动选项设置"
echo "=========================================="
