#!/bin/bash

echo "🚀 开始部署到 Vercel..."

# 检查是否已登录
if ! npx vercel whoami &> /dev/null; then
    echo "请先登录 Vercel..."
    npx vercel login
fi

# 部署项目
echo "正在部署项目..."
npx vercel --prod

echo "✅ 部署完成！"
echo "请访问上面显示的 URL 查看您的应用" 