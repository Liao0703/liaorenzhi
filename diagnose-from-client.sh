#!/bin/bash

# 从客户端诊断网站问题
echo "🔍 客户端诊断 47.109.142.72"
echo "============================"

# 1. 获取HTML内容
echo ""
echo "1️⃣ 获取网页内容..."
echo "-------------------"
curl -s http://47.109.142.72 | head -50

# 2. 检查关键资源
echo ""
echo "2️⃣ 检查页面中引用的资源..."
echo "----------------------------"
# 获取页面中的JS和CSS文件
RESOURCES=$(curl -s http://47.109.142.72 | grep -oE '(href|src)="[^"]+\.(js|css)"' | sed 's/.*="//;s/"//')

if [ -z "$RESOURCES" ]; then
    echo "❌ 页面中没有找到JS/CSS资源引用"
    echo "   可能是空白HTML或资源路径错误"
else
    echo "找到以下资源："
    echo "$RESOURCES"
    echo ""
    echo "测试资源加载："
    for resource in $RESOURCES; do
        # 如果是相对路径，添加域名
        if [[ $resource == /* ]]; then
            url="http://47.109.142.72$resource"
        else
            url="$resource"
        fi
        
        echo -n "  $url ... "
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        if [ "$STATUS" = "200" ]; then
            echo "✅ OK ($STATUS)"
        else
            echo "❌ 失败 ($STATUS)"
        fi
    done
fi

# 3. 测试API端点
echo ""
echo "3️⃣ 测试API端点..."
echo "-----------------"

# 测试健康检查
echo -n "健康检查 (/health): "
HEALTH=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://47.109.142.72/health)
HTTP_CODE=$(echo "$HEALTH" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$HEALTH" | grep -v "HTTP_CODE:")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
    echo "响应: $BODY"
else
    echo "❌ 失败 (HTTP $HTTP_CODE)"
fi

# 测试API状态
echo ""
echo -n "API状态 (/api/status): "
STATUS=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://47.109.142.72/api/status)
HTTP_CODE=$(echo "$STATUS" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$STATUS" | grep -v "HTTP_CODE:")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
    echo "响应: $BODY"
else
    echo "❌ 失败 (HTTP $HTTP_CODE)"
fi

# 4. 检查可能的路径
echo ""
echo "4️⃣ 检查常见路径..."
echo "------------------"
PATHS=(
    "/index.html"
    "/dist/index.html"
    "/assets/"
    "/favicon.ico"
    "/api/"
    "/api/auth/login"
)

for path in "${PATHS[@]}"; do
    echo -n "测试 $path ... "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://47.109.142.72$path")
    echo "HTTP $STATUS"
done

# 5. 分析问题
echo ""
echo "📊 问题分析"
echo "==========="
echo ""

# 获取完整的HTML看看是什么内容
HTML_CONTENT=$(curl -s http://47.109.142.72)
HTML_LENGTH=${#HTML_CONTENT}

echo "页面大小: $HTML_LENGTH 字节"

if [ $HTML_LENGTH -lt 100 ]; then
    echo "❌ 页面内容过短，可能是空白页或错误页"
elif [[ $HTML_CONTENT == *"<script"* ]] && [[ $HTML_CONTENT == *"src="* ]]; then
    echo "✅ 页面包含script标签"
    
    # 检查是否是Vite开发服务器页面
    if [[ $HTML_CONTENT == *"type=\"module\""* ]] && [[ $HTML_CONTENT == *"/src/"* ]]; then
        echo "⚠️  检测到Vite开发模式的HTML！"
        echo "   页面正在加载 /src/main.tsx"
        echo "   这是开发环境的配置，生产环境应该使用编译后的文件"
    fi
else
    echo "⚠️  页面可能缺少必要的资源引用"
fi

echo ""
echo "💡 建议解决方案："
echo "==============="
echo ""
echo "1. 如果是开发模式HTML（加载/src/main.tsx）："
echo "   - 需要编译项目: npm run build"
echo "   - 部署dist目录到服务器"
echo ""
echo "2. 如果资源404错误："
echo "   - 检查nginx配置的root路径"
echo "   - 确认文件已上传到正确位置"
echo ""
echo "3. 完整的HTML内容已保存到: page_content.html"
echo ""

# 保存HTML内容供分析
curl -s http://47.109.142.72 > page_content.html
echo "✅ 诊断完成！"




