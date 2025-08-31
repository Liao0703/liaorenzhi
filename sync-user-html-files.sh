#!/bin/bash
# 同步用户管理HTML文件到dist目录并部署到生产环境

echo "🔄 开始同步用户管理HTML文件..."

# 确保dist目录存在
mkdir -p dist

# 复制HTML文件到本地dist目录
echo "📁 复制HTML文件到本地dist目录..."
cp add-user-window.html edit-user-window.html dist/
echo "✅ 本地文件复制完成"

# 上传到生产服务器
echo "🚀 上传文件到生产服务器..."
scp add-user-window.html edit-user-window.html root@47.109.142.72:/root/learning-platform/dist/

if [ $? -eq 0 ]; then
    echo "✅ 文件上传成功！"
    
    # 重启前端服务以确保更新生效
    echo "🔄 重启前端服务..."
    ssh root@47.109.142.72 "cd /root/learning-platform && pm2 restart frontend"
    
    if [ $? -eq 0 ]; then
        echo "✅ 前端服务重启成功！"
        echo ""
        echo "🎉 用户管理功能修复完成！现在应该可以正常使用添加用户和编辑用户功能了。"
        echo ""
        echo "📋 测试步骤："
        echo "1. 打开用户账号管理页面"
        echo "2. 点击 '➕ 添加用户' 按钮"
        echo "3. 点击任意用户的 '编辑' 按钮"
        echo "4. 验证弹窗是否正常打开"
    else
        echo "❌ 前端服务重启失败，请手动重启"
    fi
else
    echo "❌ 文件上传失败，请检查SSH连接"
fi
