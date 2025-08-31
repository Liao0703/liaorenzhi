#!/bin/bash

# 🚀 快速上传脚本 - 47.109.142.72
# 用于快速上传前端和后端文件到服务器

echo "🚀 开始上传文件到服务器 47.109.142.72"
echo "==============================================="

# 配置信息
SERVER_IP="47.109.142.72"
SERVER_USER="root"  # 请修改为你的用户名
SERVER_PATH="/www/wwwroot/learning-platform"
LOCAL_PROJECT_DIR="$(pwd)"

# 检查必要文件是否存在
echo "🔍 检查本地文件..."
if [ ! -d "dist" ]; then
    echo "❌ 错误: dist目录不存在，请先运行 npm run build"
    exit 1
fi

if [ ! -d "php-backend" ]; then
    echo "❌ 错误: php-backend目录不存在"
    exit 1
fi

echo "✅ 本地文件检查通过"

# 询问上传方式
echo ""
echo "请选择上传方式:"
echo "1) 使用SCP上传 (需要SSH密钥或密码)"
echo "2) 手动上传指引"
echo "3) 退出"
echo ""
read -p "请选择 (1-3): " choice

case $choice in
    1)
        echo "📤 使用SCP上传文件..."
        
        # 询问是否使用密钥文件
        read -p "是否使用SSH密钥文件? (y/n): " use_key
        
        if [ "$use_key" = "y" ]; then
            read -p "请输入SSH密钥文件路径: " key_path
            SCP_CMD="scp -i $key_path"
            SSH_CMD="ssh -i $key_path"
        else
            SCP_CMD="scp"
            SSH_CMD="ssh"
        fi
        
        echo "创建服务器目录..."
        $SSH_CMD $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH/dist $SERVER_PATH/php-backend"
        
        echo "上传前端文件..."
        $SCP_CMD -r dist/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/dist/
        
        echo "上传PHP后端文件..."
        $SCP_CMD -r php-backend/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/php-backend/
        
        echo "上传数据库文件..."
        if [ -f "server/init.sql" ]; then
            $SCP_CMD server/init.sql $SERVER_USER@$SERVER_IP:$SERVER_PATH/
        fi
        
        echo "设置服务器文件权限..."
        $SSH_CMD $SERVER_USER@$SERVER_IP "chmod -R 755 $SERVER_PATH && chmod -R 777 $SERVER_PATH/php-backend/logs $SERVER_PATH/php-backend/uploads && chown -R www:www $SERVER_PATH"
        
        echo "✅ 文件上传完成！"
        ;;
    2)
        echo "📋 手动上传指引:"
        echo ""
        echo "需要上传的文件和目录："
        echo ""
        echo "1. 前端文件："
        echo "   本地: $LOCAL_PROJECT_DIR/dist/"
        echo "   服务器: $SERVER_PATH/dist/"
        echo ""
        echo "2. PHP后端文件："  
        echo "   本地: $LOCAL_PROJECT_DIR/php-backend/"
        echo "   服务器: $SERVER_PATH/php-backend/"
        echo ""
        echo "3. 数据库文件："
        echo "   本地: $LOCAL_PROJECT_DIR/server/init.sql"
        echo "   服务器: $SERVER_PATH/init.sql"
        echo ""
        echo "使用FTP/SFTP工具（如FileZilla）上传："
        echo "- 服务器地址: $SERVER_IP"
        echo "- 协议: SFTP"
        echo "- 端口: 22"
        echo "- 上传后记得设置权限：755"
        ;;
    3)
        echo "退出上传"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎯 上传完成后的下一步:"
echo "1. 登录宝塔面板修改网站根目录"
echo "2. 更新Nginx配置"
echo "3. 创建和配置数据库"
echo "4. 设置PHP后端环境变量"
echo ""
echo "📖 详细步骤请参考: 宝塔部署问题修复指南.md"
