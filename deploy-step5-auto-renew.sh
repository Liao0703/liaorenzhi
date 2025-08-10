#!/bin/bash
# 第5步：自动续期检查
# 作者：Railway Learning Platform 部署脚本
# 适用：Ubuntu 20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "🔧 第5步：自动续期检查"
echo "========================================"

DOMAIN="api.liaorenzhi.top"

# 1. 检查Certbot是否已安装
echo "🔐 检查Certbot安装状态..."
if ! command -v certbot >/dev/null 2>&1; then
    echo "❌ Certbot未安装，请先完成第4步"
    exit 1
fi
echo "✅ Certbot已安装：$(certbot --version | head -n1)"

# 2. 检查证书状态
echo ""
echo "📜 检查当前证书状态..."
if sudo certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
    echo "✅ 找到域名证书：$DOMAIN"
    echo ""
    echo "证书详情："
    sudo certbot certificates | grep -A 15 "$DOMAIN"
else
    echo "❌ 未找到域名证书，请先完成第4步"
    exit 1
fi

# 3. 检查自动续期定时器
echo ""
echo "⏰ 检查自动续期定时器..."

# Snap安装的certbot会自动配置systemd timer
if systemctl list-timers | grep -q "snap.certbot.renew"; then
    echo "✅ Snap certbot自动续期定时器已配置"
    echo ""
    echo "定时器状态："
    systemctl list-timers | grep certbot || echo "未找到certbot定时器"
else
    echo "⚠️  未找到snap certbot定时器，检查其他可能的定时任务..."
    
    # 检查cron任务
    if crontab -l 2>/dev/null | grep -q certbot; then
        echo "✅ 找到cron定时任务"
        echo "Cron任务："
        crontab -l | grep certbot
    else
        echo "⚠️  未找到cron定时任务"
    fi
    
    # 检查系统cron
    if [ -f /etc/cron.d/certbot ] || ls /etc/cron.*/*certbot* 2>/dev/null; then
        echo "✅ 找到系统级定时任务"
        ls -la /etc/cron.d/certbot 2>/dev/null || true
        ls -la /etc/cron.*/*certbot* 2>/dev/null || true
    else
        echo "⚠️  未找到系统级定时任务"
    fi
fi

# 4. 测试续期功能（干运行）
echo ""
echo "🧪 测试证书续期功能（干运行）..."
echo "这个测试不会实际续期证书，只检查配置是否正确..."

if sudo certbot renew --dry-run --quiet; then
    echo "✅ 证书续期测试通过"
else
    echo "❌ 证书续期测试失败"
    echo "详细测试（显示错误信息）："
    sudo certbot renew --dry-run
    exit 1
fi

# 5. 检查证书有效期
echo ""
echo "📅 检查证书有效期..."

# 使用openssl检查证书
CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ -n "$CERT_INFO" ]; then
    echo "证书有效期信息："
    echo "$CERT_INFO"
    
    # 提取过期时间
    EXPIRE_DATE=$(echo "$CERT_INFO" | grep "notAfter=" | cut -d= -f2)
    if [ -n "$EXPIRE_DATE" ]; then
        echo ""
        echo "证书过期时间：$EXPIRE_DATE"
        
        # 计算剩余天数（如果有date命令支持）
        if command -v date >/dev/null 2>&1; then
            EXPIRE_TIMESTAMP=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null || echo "")
            CURRENT_TIMESTAMP=$(date +%s)
            if [ -n "$EXPIRE_TIMESTAMP" ] && [ "$EXPIRE_TIMESTAMP" -gt "$CURRENT_TIMESTAMP" ]; then
                DAYS_LEFT=$(( (EXPIRE_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
                echo "证书剩余有效期：$DAYS_LEFT 天"
                
                if [ "$DAYS_LEFT" -gt 30 ]; then
                    echo "✅ 证书有效期充足"
                elif [ "$DAYS_LEFT" -gt 7 ]; then
                    echo "⚠️  证书即将过期，但在自动续期范围内"
                else
                    echo "🚨 证书即将过期，请注意续期"
                fi
            fi
        fi
    fi
else
    echo "⚠️  无法获取证书信息，可能网络问题或证书配置错误"
fi

# 6. 创建手动续期脚本
echo ""
echo "📝 创建手动续期脚本..."

cat > manual-renew-cert.sh << 'EOF'
#!/bin/bash
# 手动证书续期脚本
# 使用方法: bash manual-renew-cert.sh

echo "开始手动续期SSL证书..."

# 续期所有证书
sudo certbot renew

# 检查Nginx配置
sudo nginx -t

# 重载Nginx配置
sudo systemctl reload nginx

echo "证书续期完成！"

# 显示证书状态
sudo certbot certificates
EOF

chmod +x manual-renew-cert.sh
echo "✅ 手动续期脚本已创建：manual-renew-cert.sh"

# 7. 创建证书监控脚本
echo ""
echo "📊 创建证书监控脚本..."

cat > check-cert-status.sh << 'EOF'
#!/bin/bash
# 证书状态检查脚本
# 使用方法: bash check-cert-status.sh

DOMAIN="api.liaorenzhi.top"

echo "========================================"
echo "🔍 证书状态检查 - $(date)"
echo "========================================"

# 1. 检查证书列表
echo "📜 证书列表："
sudo certbot certificates

echo ""

# 2. 检查HTTPS连接
echo "🔗 测试HTTPS连接："
if curl -I -s --connect-timeout 10 "https://$DOMAIN" | head -n1; then
    echo "✅ HTTPS连接正常"
else
    echo "❌ HTTPS连接失败"
fi

echo ""

# 3. 检查证书详情
echo "📋 证书详情："
echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -text | grep -A 2 "Validity"

echo ""

# 4. 检查自动续期状态
echo "⏰ 自动续期状态："
systemctl list-timers | grep certbot || echo "未找到certbot定时器"

echo ""
echo "========================================"
EOF

chmod +x check-cert-status.sh
echo "✅ 证书监控脚本已创建：check-cert-status.sh"

# 8. 显示续期配置信息
echo ""
echo "📋 自动续期配置摘要："
echo "   - 续期方式: Let's Encrypt 自动续期"
echo "   - 检查频率: 每天2次（由snap或系统定时器控制）"
echo "   - 续期阈值: 证书剩余30天时自动续期"
echo "   - 续期后操作: 自动重载Nginx配置"

# 9. 显示管理命令
echo ""
echo "🔧 证书管理命令："
echo "   查看证书状态: sudo certbot certificates"
echo "   测试续期: sudo certbot renew --dry-run"
echo "   强制续期: sudo certbot renew --force-renewal"
echo "   手动续期: bash manual-renew-cert.sh"
echo "   状态检查: bash check-cert-status.sh"

# 10. 显示重要文件位置
echo ""
echo "📁 重要文件位置："
echo "   证书目录: /etc/letsencrypt/live/$DOMAIN/"
echo "   配置目录: /etc/letsencrypt/"
echo "   日志目录: /var/log/letsencrypt/"
echo "   Nginx配置: /etc/nginx/sites-available/$DOMAIN"

echo ""
echo "========================================"
echo "✅ 第5步完成！自动续期检查和配置成功"
echo ""
echo "📋 续期验证："
echo "   - 自动续期: 已配置并测试通过"
echo "   - 手动工具: manual-renew-cert.sh"
echo "   - 监控工具: check-cert-status.sh"
echo ""
echo "📋 下一步：执行 bash deploy-step6-pm2-daemon.sh"
echo "========================================"
