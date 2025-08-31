#!/bin/bash

# 宝塔紧急修复 - 本地编译并上传
echo "🚨 宝塔网站紧急修复"
echo "==================="
echo ""

# 检查本地是否有dist目录
if [ ! -d "dist" ]; then
    echo "📦 本地没有dist目录，开始编译..."
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "安装依赖..."
        npm install
    fi
    
    # 编译项目
    echo "编译项目..."
    npm run build
    
    if [ ! -d "dist" ]; then
        echo "❌ 编译失败！"
        exit 1
    fi
fi

echo "✅ dist目录准备就绪"
echo ""
echo "📤 准备上传文件..."
echo ""
echo "请按照以下步骤操作："
echo ""
echo "1. 使用FTP或宝塔文件管理器上传dist目录"
echo "   - 登录宝塔面板：http://47.109.142.72:8888"
echo "   - 点击左侧'文件'"
echo "   - 进入网站目录：/www/wwwroot/learning-platform/ 或 /www/wwwroot/47.109.142.72/"
echo "   - 上传整个dist目录"
echo ""
echo "2. 或使用SCP命令上传（需要SSH密码）："
echo "   scp -r dist/* root@47.109.142.72:/www/wwwroot/learning-platform/dist/"
echo ""
echo "3. 上传后在宝塔面板中："
echo "   - 网站设置 → 网站目录 → 运行目录改为：/dist"
echo "   - 网站设置 → 伪静态 → 添加规则"
echo "   - 点击'重启'按钮"
echo ""
echo "💡 提示：dist目录内容："
ls -la dist/ | head -10
echo ""
echo "文件大小："
du -sh dist/




