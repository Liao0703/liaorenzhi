#!/bin/bash

echo "========================================"
echo "🚀 部署管理员概览实时统计功能"
echo "========================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 配置信息
DB_CONFIG="/www/wwwroot/api.liaorenzhi.top/.env"

# 加载数据库配置
if [ -f "$DB_CONFIG" ]; then
    source "$DB_CONFIG"
    echo -e "${GREEN}✅ 已加载数据库配置${NC}"
else
    echo -e "${RED}❌ 未找到数据库配置文件${NC}"
    exit 1
fi

# 1. 创建数据库表和视图
echo -e "\n${YELLOW}📊 步骤1: 创建统计数据库结构...${NC}"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < create-overview-statistics-tables.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库表和视图创建成功${NC}"
else
    echo -e "${RED}❌ 数据库创建失败${NC}"
    exit 1
fi

# 2. 部署新的API路由
echo -e "\n${YELLOW}🔌 步骤2: 部署API接口...${NC}"

# 上传新的路由文件
scp server/routes/overview-statistics.js root@116.62.65.246:/www/wwwroot/api.liaorenzhi.top/server/routes/

# 更新服务器上的app.js
ssh root@116.62.65.246 << 'EOF'
cd /www/wwwroot/api.liaorenzhi.top
# 备份原文件
cp server/app.js server/app.js.bak.$(date +%Y%m%d_%H%M%S)

# 添加新路由（如果还未添加）
if ! grep -q "overview-statistics" server/app.js; then
    sed -i "/app.use('\/api\/statistics'/a app.use('/api/overview-statistics', require('./routes/overview-statistics'));" server/app.js
    echo "✅ 已添加overview-statistics路由"
else
    echo "ℹ️  overview-statistics路由已存在"
fi
EOF

# 3. 部署前端服务文件
echo -e "\n${YELLOW}🎨 步骤3: 部署前端服务...${NC}"

# 上传前端服务文件
scp src/services/overviewStatisticsService.ts root@116.62.65.246:/www/wwwroot/front.liaorenzhi.top/src/services/

# 4. 重启后端服务
echo -e "\n${YELLOW}🔄 步骤4: 重启服务...${NC}"
ssh root@116.62.65.246 << 'EOF'
cd /www/wwwroot/api.liaorenzhi.top
pm2 restart api-server
pm2 logs api-server --lines 20
EOF

# 5. 测试新API
echo -e "\n${YELLOW}🧪 步骤5: 测试API接口...${NC}"

# 获取管理员token
TOKEN=$(curl -s -X POST https://api.liaorenzhi.top/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ 获取管理员token失败${NC}"
else
    echo -e "${GREEN}✅ 成功获取管理员token${NC}"
    
    # 测试概览统计接口
    echo -e "\n测试概览统计接口..."
    RESPONSE=$(curl -s -X GET https://api.liaorenzhi.top/api/overview-statistics/overview \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 概览统计接口正常${NC}"
        echo "$RESPONSE" | jq '.data.stats'
    else
        echo -e "${RED}❌ 概览统计接口异常${NC}"
        echo "$RESPONSE"
    fi
    
    # 测试实时统计接口
    echo -e "\n测试实时统计接口..."
    REALTIME=$(curl -s -X GET https://api.liaorenzhi.top/api/overview-statistics/realtime \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$REALTIME" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 实时统计接口正常${NC}"
        echo "$REALTIME" | jq '.data'
    else
        echo -e "${RED}❌ 实时统计接口异常${NC}"
    fi
fi

# 6. 初始化统计数据
echo -e "\n${YELLOW}📈 步骤6: 初始化统计数据...${NC}"
curl -s -X POST https://api.liaorenzhi.top/api/overview-statistics/refresh \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n${GREEN}🎉 部署完成！${NC}"
echo -e "${YELLOW}提示：${NC}"
echo -e "1. 访问管理员面板查看实时统计：https://www.liaorenzhi.top/admin"
echo -e "2. 统计数据每小时自动更新一次"
echo -e "3. 可通过管理员面板手动刷新统计数据"

# 显示数据库统计视图
echo -e "\n${YELLOW}📊 创建的统计视图：${NC}"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'v_%';"

echo -e "\n${YELLOW}📊 创建的统计表：${NC}"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE '%statistics%';SHOW TABLES LIKE '%activities%';SHOW TABLES LIKE '%records%';"
