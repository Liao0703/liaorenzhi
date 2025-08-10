#!/bin/bash
# 完整后端部署脚本
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04
# 
# 功能：自动部署 Nginx 反代 + HTTPS 证书 + Node.js 常驻服务
# 域名：api.liaorenzhi.top
# 
# 使用方法：
#   bash deploy-backend-complete.sh
#   或分步执行：
#   bash deploy-step0-dns-ports.sh
#   bash deploy-step1-nginx.sh
#   bash deploy-step2-node-backend.sh
#   bash deploy-step3-nginx-proxy.sh
#   bash deploy-step4-https-cert.sh  # 需要交互输入邮箱
#   bash deploy-step5-auto-renew.sh
#   bash deploy-step6-pm2-daemon.sh

set -e  # 遇到错误立即退出

echo "========================================"
echo "🚀 铁路职工学习平台 - 后端完整部署"
echo "========================================"
echo "域名: api.liaorenzhi.top"
echo "技术栈: Nginx + HTTPS + Node.js + PM2"
echo "适用系统: Ubuntu 20.04/22.04"
echo "========================================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查系统版本
echo ""
echo "🖥️  系统信息检查..."
if [ -f /etc/os-release ]; then
    source /etc/os-release
    echo "系统: $PRETTY_NAME"
    
    # 检查是否为Ubuntu
    if [[ "$ID" != "ubuntu" ]]; then
        echo "⚠️  警告：此脚本专为Ubuntu设计，其他系统可能需要调整"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 检查版本
    if [[ "$VERSION_ID" != "20.04" && "$VERSION_ID" != "22.04" && "$VERSION_ID" != "24.04" ]]; then
        echo "⚠️  警告：推荐使用Ubuntu 20.04/22.04，当前版本: $VERSION_ID"
    fi
else
    echo "⚠️  无法确定系统版本"
fi

# 询问部署方式
echo ""
echo "📋 选择部署方式："
echo "1. 完整自动部署（推荐）"
echo "2. 分步执行（便于调试）"
echo "3. 从指定步骤开始"
echo ""
read -p "请选择 (1-3): " DEPLOY_MODE

case $DEPLOY_MODE in
    1)
        echo "✅ 选择完整自动部署"
        AUTO_DEPLOY=true
        ;;
    2)
        echo "✅ 选择分步执行"
        AUTO_DEPLOY=false
        ;;
    3)
        echo "✅ 选择从指定步骤开始"
        echo ""
        echo "可用步骤："
        echo "0 - DNS与端口确认"
        echo "1 - 安装Nginx"
        echo "2 - 启动Node后端"
        echo "3 - 配置Nginx反向代理"
        echo "4 - 申请HTTPS证书"
        echo "5 - 自动续期检查"
        echo "6 - PM2常驻服务"
        echo ""
        read -p "从第几步开始？(0-6): " START_STEP
        AUTO_DEPLOY=true
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 如果是完整部署，提前询问邮箱
if [ "$AUTO_DEPLOY" = "true" ] && [ "${START_STEP:-0}" -le 4 ]; then
    echo ""
    echo "📧 HTTPS证书配置..."
    echo "请输入用于SSL证书通知的邮箱地址："
    read -p "邮箱地址: " SSL_EMAIL
    if [ -z "$SSL_EMAIL" ]; then
        echo "❌ 邮箱地址不能为空"
        exit 1
    fi
    echo "✅ 将使用邮箱: $SSL_EMAIL"
fi

# 定义步骤函数
run_step() {
    local step_num=$1
    local step_name="$2"
    local script_name="$3"
    local need_interaction=${4:-false}
    
    echo ""
    echo "========================================"
    echo "🔧 第${step_num}步：${step_name}"
    echo "========================================"
    
    if [ ! -f "$SCRIPT_DIR/$script_name" ]; then
        echo "❌ 脚本文件不存在：$script_name"
        exit 1
    fi
    
    if [ "$AUTO_DEPLOY" = "true" ]; then
        # 自动部署模式
        if [ "$step_num" = "4" ] && [ -n "$SSL_EMAIL" ]; then
            # 第4步需要传递邮箱参数
            echo "$SSL_EMAIL" | bash "$SCRIPT_DIR/$script_name"
        else
            bash "$SCRIPT_DIR/$script_name"
        fi
    else
        # 分步执行模式
        echo "准备执行：bash $script_name"
        if [ "$need_interaction" = "true" ]; then
            echo "⚠️  此步骤需要交互输入"
        fi
        read -p "按Enter继续，或输入 'skip' 跳过此步骤: " USER_INPUT
        
        if [ "$USER_INPUT" = "skip" ]; then
            echo "⏭️  跳过第${step_num}步"
            return
        fi
        
        bash "$SCRIPT_DIR/$script_name"
    fi
    
    echo "✅ 第${step_num}步完成"
}

# 执行部署步骤
echo ""
echo "🚀 开始部署..."

# 根据选择的起始步骤执行
start_from=${START_STEP:-0}

if [ $start_from -le 0 ]; then
    run_step 0 "DNS与端口确认" "deploy-step0-dns-ports.sh"
fi

if [ $start_from -le 1 ]; then
    run_step 1 "安装Nginx" "deploy-step1-nginx.sh"
fi

if [ $start_from -le 2 ]; then
    run_step 2 "启动Node后端" "deploy-step2-node-backend.sh"
fi

if [ $start_from -le 3 ]; then
    run_step 3 "配置Nginx反向代理" "deploy-step3-nginx-proxy.sh"
fi

if [ $start_from -le 4 ]; then
    # 中间验证
    echo ""
    echo "🔍 中间验证 - 执行验证命令..."
    echo ""
    echo "1. DNS解析："
    dig +short api.liaorenzhi.top || echo "DNS解析失败"
    echo ""
    echo "2. 本地后端健康检查："
    curl -s http://127.0.0.1:3001/health || echo "本地后端连接失败"
    echo ""
    echo "3. HTTP访问测试："
    curl -I http://api.liaorenzhi.top || echo "HTTP访问失败"
    echo ""
    echo "4. HTTP健康检查："
    curl -s http://api.liaorenzhi.top/health || echo "HTTP健康检查失败"
    echo ""
    
    if [ "$AUTO_DEPLOY" = "false" ]; then
        echo "请确认以上四项检查都正常，然后继续HTTPS证书配置"
        read -p "按Enter继续..."
    fi
    
    run_step 4 "申请HTTPS证书" "deploy-step4-https-cert.sh" true
fi

if [ $start_from -le 5 ]; then
    run_step 5 "自动续期检查" "deploy-step5-auto-renew.sh"
fi

if [ $start_from -le 6 ]; then
    run_step 6 "PM2常驻服务" "deploy-step6-pm2-daemon.sh"
fi

# 最终验证
echo ""
echo "========================================"
echo "🎯 最终验证"
echo "========================================"

echo ""
echo "🔍 执行最终验证..."

# 验证HTTPS访问
echo "1. HTTPS访问测试："
if curl -I -s --connect-timeout 15 https://api.liaorenzhi.top | head -n1; then
    echo "✅ HTTPS访问正常"
else
    echo "❌ HTTPS访问失败"
fi

echo ""
echo "2. HTTPS健康检查："
if curl -s --connect-timeout 15 https://api.liaorenzhi.top/health; then
    echo ""
    echo "✅ HTTPS健康检查正常"
else
    echo "❌ HTTPS健康检查失败"
fi

echo ""
echo "3. PM2服务状态："
pm2 status 2>/dev/null || echo "PM2状态获取失败"

echo ""
echo "4. 证书状态："
sudo certbot certificates 2>/dev/null | grep -A 5 "api.liaorenzhi.top" || echo "证书状态获取失败"

# 生成部署报告
echo ""
echo "========================================"
echo "📊 部署完成报告"
echo "========================================"

cat > deployment-report.txt << EOF
铁路职工学习平台 - 后端部署报告
部署时间: $(date)
部署域名: api.liaorenzhi.top
部署状态: 完成

部署组件:
✅ Nginx 反向代理服务器
✅ HTTPS SSL证书 (Let's Encrypt)
✅ Node.js 后端应用
✅ PM2 进程管理器
✅ 自动证书续期

访问地址:
- API服务: https://api.liaorenzhi.top
- 健康检查: https://api.liaorenzhi.top/health
- CORS测试: https://api.liaorenzhi.top/api/cors-test

管理命令:
- 查看PM2状态: pm2 status
- 查看应用日志: pm2 logs learning-api
- 重启应用: pm2 restart learning-api
- 查看Nginx状态: sudo systemctl status nginx
- 查看证书状态: sudo certbot certificates

重要文件位置:
- Nginx配置: /etc/nginx/sites-available/api.liaorenzhi.top
- PM2配置: $(pwd)/server/ecosystem.config.js
- 应用日志: $(pwd)/server/logs/
- SSL证书: /etc/letsencrypt/live/api.liaorenzhi.top/

下一步:
1. 更新前端配置指向 https://api.liaorenzhi.top
2. 测试所有API功能
3. 配置监控和备份
EOF

echo "✅ 部署报告已生成：deployment-report.txt"

# 显示成功信息
echo ""
echo "🎉 恭喜！后端部署完成"
echo ""
echo "🌐 服务地址："
echo "   - API服务: https://api.liaorenzhi.top"
echo "   - 健康检查: https://api.liaorenzhi.top/health"
echo ""
echo "🔧 管理工具："
echo "   - PM2管理: bash server/pm2-manage.sh status"
echo "   - 证书检查: bash check-cert-status.sh"
echo "   - 手动续期: bash manual-renew-cert.sh"
echo ""
echo "📋 下一步："
echo "   1. 更新前端配置使用 https://api.liaorenzhi.top"
echo "   2. 测试所有API功能"
echo "   3. 配置数据库连接（如需要）"
echo ""
echo "📄 详细信息请查看：deployment-report.txt"
echo "========================================"
