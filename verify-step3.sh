#!/bin/bash
# 第3步验证脚本
# 在服务器上执行完 deploy-step3-nginx-proxy.sh 后运行此脚本
# 作者：Railway Learning Platform 部署验证

set -e

echo "========================================"
echo "🔍 第3步部署验证检查"
echo "========================================"
echo "时间: $(date)"
echo "服务器: $(hostname)"
echo "用户: $(whoami)"
echo "========================================"

# 预期的服务器IP（请根据实际情况修改）
EXPECTED_SERVER_IP="116.62.65.246"
DOMAIN="api.liaorenzhi.top"
BACKEND_PORT="3001"

echo ""
echo "1️⃣ DNS解析验证..."
echo "检查域名: $DOMAIN"

DNS_RESULT=$(dig +short $DOMAIN | tail -n1)
if [ -n "$DNS_RESULT" ]; then
    echo "✅ DNS解析结果: $DNS_RESULT"
    
    if [ "$DNS_RESULT" = "$EXPECTED_SERVER_IP" ]; then
        echo "✅ DNS解析正确匹配服务器IP"
    else
        echo "⚠️  DNS解析IP与预期不符"
        echo "   预期: $EXPECTED_SERVER_IP"
        echo "   实际: $DNS_RESULT"
        echo "   请检查域名解析配置"
    fi
else
    echo "❌ DNS解析失败"
    echo "请检查："
    echo "  1. 域名是否已正确配置A记录"
    echo "  2. DNS是否已传播生效"
    exit 1
fi

echo ""
echo "2️⃣ 本地后端健康检查..."
echo "检查地址: http://127.0.0.1:$BACKEND_PORT/health"

if curl -s --connect-timeout 5 "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null; then
    echo "✅ 后端连接成功"
    echo "响应内容:"
    curl -s "http://127.0.0.1:$BACKEND_PORT/health" | python3 -m json.tool 2>/dev/null || curl -s "http://127.0.0.1:$BACKEND_PORT/health"
else
    echo "❌ 本地后端连接失败"
    echo "故障排查："
    echo "  检查端口占用: ss -tulpn | grep :$BACKEND_PORT"
    echo "  检查Node进程: ps aux | grep node"
    echo "  查看后端日志: tail -20 server/logs/app.log"
    exit 1
fi

echo ""
echo "3️⃣ HTTP代理访问测试..."
echo "检查地址: http://$DOMAIN"

HTTP_RESPONSE=$(curl -I -s --connect-timeout 10 "http://$DOMAIN" | head -n1)
if [ -n "$HTTP_RESPONSE" ] && echo "$HTTP_RESPONSE" | grep -q "200\|301\|302"; then
    echo "✅ HTTP代理访问正常"
    echo "响应状态: $HTTP_RESPONSE"
    
    # 显示更多响应头信息
    echo "响应头信息:"
    curl -I -s --connect-timeout 10 "http://$DOMAIN" | head -10
else
    echo "❌ HTTP代理访问失败"
    echo "响应: $HTTP_RESPONSE"
    echo "故障排查："
    echo "  检查Nginx状态: sudo systemctl status nginx"
    echo "  检查Nginx配置: sudo nginx -t"
    echo "  查看错误日志: sudo tail -20 /var/log/nginx/error.log"
    exit 1
fi

echo ""
echo "4️⃣ HTTP健康检查..."
echo "检查地址: http://$DOMAIN/health"

if curl -s --connect-timeout 10 "http://$DOMAIN/health" >/dev/null; then
    echo "✅ HTTP健康检查成功"
    echo "响应内容:"
    curl -s "http://$DOMAIN/health" | python3 -m json.tool 2>/dev/null || curl -s "http://$DOMAIN/health"
else
    echo "❌ HTTP健康检查失败"
    echo "故障排查："
    echo "  检查代理配置: sudo cat /etc/nginx/sites-available/$DOMAIN"
    echo "  查看访问日志: sudo tail -20 /var/log/nginx/$DOMAIN.access.log"
    echo "  查看错误日志: sudo tail -20 /var/log/nginx/$DOMAIN.error.log"
    exit 1
fi

echo ""
echo "5️⃣ 额外的连通性测试..."

# 测试CORS
echo "测试CORS配置:"
if curl -s --connect-timeout 10 "http://$DOMAIN/api/cors-test" >/dev/null; then
    echo "✅ CORS测试通过"
    curl -s "http://$DOMAIN/api/cors-test" | python3 -m json.tool 2>/dev/null || curl -s "http://$DOMAIN/api/cors-test"
else
    echo "⚠️  CORS测试失败（非关键错误）"
fi

echo ""
echo "6️⃣ 服务状态检查..."

# 检查Nginx状态
echo "Nginx服务状态:"
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx服务运行正常"
else
    echo "❌ Nginx服务异常"
    sudo systemctl status nginx --no-pager -l
fi

# 检查端口监听
echo ""
echo "端口监听状态:"
echo "80端口 (HTTP):"
ss -tulpn | grep ":80 " && echo "✅ HTTP端口正常监听" || echo "❌ HTTP端口未监听"

echo "3001端口 (Node后端):"
ss -tulpn | grep ":3001 " && echo "✅ Node后端端口正常监听" || echo "❌ Node后端端口未监听"

echo ""
echo "========================================"
echo "📊 验证总结"
echo "========================================"

# 再次快速测试所有关键点
ALL_GOOD=true

# 快速测试DNS
if ! dig +short $DOMAIN >/dev/null 2>&1; then
    echo "❌ DNS解析: 失败"
    ALL_GOOD=false
else
    echo "✅ DNS解析: 正常"
fi

# 快速测试本地后端
if curl -s --connect-timeout 5 "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null; then
    echo "✅ 本地后端: 正常"
else
    echo "❌ 本地后端: 失败"
    ALL_GOOD=false
fi

# 快速测试HTTP代理
if curl -I -s --connect-timeout 10 "http://$DOMAIN" >/dev/null; then
    echo "✅ HTTP代理: 正常"
else
    echo "❌ HTTP代理: 失败"
    ALL_GOOD=false
fi

# 快速测试HTTP健康检查
if curl -s --connect-timeout 10 "http://$DOMAIN/health" >/dev/null; then
    echo "✅ HTTP健康检查: 正常"
else
    echo "❌ HTTP健康检查: 失败"
    ALL_GOOD=false
fi

echo ""
if [ "$ALL_GOOD" = "true" ]; then
    echo "🎉 所有验证通过！"
    echo ""
    echo "📋 下一步操作："
    echo "   bash deploy-step4-https-cert.sh"
    echo ""
    echo "🔧 参考验证命令："
    echo "   dig +short $DOMAIN"
    echo "   curl -s http://127.0.0.1:$BACKEND_PORT/health"
    echo "   curl -I http://$DOMAIN"
    echo "   curl -s http://$DOMAIN/health"
else
    echo "❌ 验证未全部通过，请解决上述问题后重试"
    echo ""
    echo "📋 故障排除指南："
    echo "   1. 检查DNS配置是否正确"
    echo "   2. 确认Node后端服务正在运行"
    echo "   3. 验证Nginx配置语法正确"
    echo "   4. 查看相关日志文件"
    exit 1
fi

echo "========================================"
