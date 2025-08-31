#!/bin/bash
# 快速修复生产环境用户管理功能

echo "🔧 快速修复用户账号管理404错误"
echo ""
echo "问题: 添加用户和编辑用户功能显示404错误"
echo "原因: HTML文件未部署到生产环境的dist目录"
echo ""

# 确保本地dist目录包含所需文件
echo "📋 检查本地文件..."
if [ -f "add-user-window.html" ] && [ -f "edit-user-window.html" ]; then
    echo "✅ 本地HTML文件存在"
    cp add-user-window.html edit-user-window.html dist/
    echo "✅ 文件已复制到本地dist目录"
else
    echo "❌ 缺少必需的HTML文件"
    exit 1
fi

echo ""
echo "🚀 部署选项："
echo "1. 使用宝塔面板手动上传（推荐）"
echo "2. 使用SCP命令上传"
echo "3. 直接SSH登录服务器操作"
echo ""

read -p "请选择部署方式 (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "📋 宝塔面板上传步骤："
        echo "1. 访问: http://47.109.142.72:8888"
        echo "2. 登录宝塔面板"
        echo "3. 文件管理 → 导航到: /root/learning-platform/dist/"
        echo "4. 上传以下文件:"
        echo "   - $(pwd)/add-user-window.html"
        echo "   - $(pwd)/edit-user-window.html"
        echo "5. 重启应用: 在终端执行 'pm2 restart frontend'"
        ;;
    2)
        echo ""
        echo "🔑 需要服务器密码来上传文件..."
        echo "执行以下命令："
        echo ""
        echo "scp add-user-window.html edit-user-window.html root@47.109.142.72:/root/learning-platform/dist/"
        echo ""
        echo "上传完成后，重启服务："
        echo "ssh root@47.109.142.72 \"pm2 restart frontend\""
        ;;
    3)
        echo ""
        echo "📋 SSH操作步骤："
        echo "1. ssh root@47.109.142.72"
        echo "2. cd /root/learning-platform"
        echo "3. git pull  # 拉取最新代码"
        echo "4. cp add-user-window.html edit-user-window.html dist/"
        echo "5. pm2 restart frontend"
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎯 修复完成后，验证步骤："
echo "1. 访问用户账号管理页面"
echo "2. 点击 '➕ 添加用户' 按钮"
echo "3. 点击任意用户的 '编辑' 按钮"
echo "4. 确认弹窗能够正常打开"
