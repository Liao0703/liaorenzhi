#!/bin/bash

# 宝塔面板404错误修复脚本
# 用于修复宝塔面板本身无法访问的问题
# 服务器: 47.109.142.72

echo "======================================"
echo "宝塔面板404错误紧急修复"
echo "服务器: 47.109.142.72"
echo "======================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${YELLOW}[步骤1] 检查宝塔面板服务状态${NC}"
echo "======================================"

# 检查宝塔进程
if ps aux | grep -v grep | grep -q "bt.py"; then
    echo -e "${GREEN}✅ 宝塔面板进程正在运行${NC}"
    ps aux | grep -v grep | grep "bt.py" | head -2
else
    echo -e "${RED}❌ 宝塔面板进程未运行${NC}"
fi

# 检查宝塔服务状态
echo -e "\n检查宝塔服务状态..."
if [ -f /etc/init.d/bt ]; then
    /etc/init.d/bt status
else
    echo -e "${RED}❌ 宝塔服务脚本不存在${NC}"
fi

echo -e "\n${YELLOW}[步骤2] 检查端口监听${NC}"
echo "======================================"

# 检查8888端口
if netstat -tlnp 2>/dev/null | grep -q ":8888 "; then
    echo -e "${GREEN}✅ 8888端口正在监听${NC}"
    netstat -tlnp | grep ":8888 "
else
    echo -e "${RED}❌ 8888端口未监听，宝塔面板未正常运行${NC}"
fi

# 检查其他可能的宝塔端口
echo -e "\n检查其他可能的端口..."
for port in 8888 888 8088 7800; do
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}发现端口 $port 正在监听${NC}"
    fi
done

echo -e "\n${YELLOW}[步骤3] 检查宝塔面板文件${NC}"
echo "======================================"

# 检查宝塔安装目录
PANEL_PATH="/www/server/panel"
if [ -d "$PANEL_PATH" ]; then
    echo -e "${GREEN}✅ 宝塔面板目录存在: $PANEL_PATH${NC}"
    
    # 检查关键文件
    if [ -f "$PANEL_PATH/BT-Panel" ]; then
        echo -e "${GREEN}✅ BT-Panel主程序存在${NC}"
    else
        echo -e "${RED}❌ BT-Panel主程序不存在${NC}"
    fi
    
    if [ -f "$PANEL_PATH/data/port.pl" ]; then
        PANEL_PORT=$(cat $PANEL_PATH/data/port.pl)
        echo -e "${BLUE}宝塔面板端口配置: $PANEL_PORT${NC}"
    fi
else
    echo -e "${RED}❌ 宝塔面板目录不存在${NC}"
    echo "宝塔可能未安装或安装损坏"
fi

echo -e "\n${YELLOW}[步骤4] 尝试重启宝塔面板${NC}"
echo "======================================"

# 停止宝塔
echo "停止宝塔面板..."
/etc/init.d/bt stop 2>/dev/null || service bt stop 2>/dev/null || echo "无法停止宝塔服务"

# 等待2秒
sleep 2

# 启动宝塔
echo "启动宝塔面板..."
/etc/init.d/bt start 2>/dev/null || service bt start 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 宝塔面板启动命令执行成功${NC}"
else
    echo -e "${RED}❌ 宝塔面板启动失败${NC}"
fi

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 再次检查端口
if netstat -tlnp 2>/dev/null | grep -q ":8888 "; then
    echo -e "${GREEN}✅ 宝塔面板已在8888端口启动${NC}"
else
    echo -e "${RED}❌ 宝塔面板仍未在8888端口监听${NC}"
fi

echo -e "\n${YELLOW}[步骤5] 检查防火墙设置${NC}"
echo "======================================"

# 检查防火墙状态
if command -v firewall-cmd &> /dev/null; then
    echo "Firewalld防火墙状态:"
    firewall-cmd --state 2>/dev/null
    
    # 检查8888端口是否开放
    if firewall-cmd --list-ports 2>/dev/null | grep -q "8888/tcp"; then
        echo -e "${GREEN}✅ 8888端口已在防火墙开放${NC}"
    else
        echo -e "${YELLOW}⚠️  8888端口未在防火墙开放${NC}"
        echo "添加防火墙规则..."
        firewall-cmd --permanent --add-port=8888/tcp 2>/dev/null
        firewall-cmd --reload 2>/dev/null
    fi
elif command -v ufw &> /dev/null; then
    echo "UFW防火墙状态:"
    ufw status 2>/dev/null
else
    echo "iptables规则:"
    iptables -L -n | grep -E "8888|8088" | head -5
fi

echo -e "\n${YELLOW}[步骤6] 获取宝塔面板信息${NC}"
echo "======================================"

# 尝试获取面板信息
if [ -f /etc/init.d/bt ]; then
    echo "获取宝塔面板访问信息..."
    /etc/init.d/bt default
    
    echo -e "\n获取面板用户名..."
    bt default 2>/dev/null | grep username || echo "无法获取用户名"
    
    echo -e "\n重置面板密码（如需要）:"
    echo "命令: cd /www/server/panel && python tools.py panel 新密码"
fi

echo -e "\n${YELLOW}[步骤7] 检查Nginx服务${NC}"
echo "======================================"

# 检查nginx是否正常
if systemctl is-active --quiet nginx 2>/dev/null || service nginx status 2>/dev/null | grep -q running; then
    echo -e "${GREEN}✅ Nginx服务正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx服务未运行${NC}"
    echo "尝试启动Nginx..."
    systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null
fi

echo -e "\n${YELLOW}[步骤8] 修复建议${NC}"
echo "======================================"

# 检查是否需要重装
if [ ! -f "$PANEL_PATH/BT-Panel" ]; then
    echo -e "${RED}宝塔面板文件缺失，可能需要重新安装${NC}"
    echo ""
    echo "重新安装宝塔面板命令:"
    echo -e "${BLUE}wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh${NC}"
    echo ""
    echo "注意: 重装不会影响网站数据，但会重置面板设置"
else
    echo -e "${GREEN}修复操作已完成！${NC}"
    echo ""
    echo "请尝试访问:"
    
    # 获取实际端口
    if [ -f "$PANEL_PATH/data/port.pl" ]; then
        REAL_PORT=$(cat $PANEL_PATH/data/port.pl)
        echo "1. 宝塔面板: http://47.109.142.72:$REAL_PORT"
    else
        echo "1. 宝塔面板: http://47.109.142.72:8888"
    fi
    
    echo "2. 网站首页: http://47.109.142.72"
    echo ""
    echo "如果还是无法访问，请检查:"
    echo "- 阿里云安全组是否开放8888端口"
    echo "- 服务器防火墙设置"
    echo "- 宝塔SSL设置（可能强制HTTPS）"
fi

echo -e "\n${YELLOW}[步骤9] 生成快速命令${NC}"
echo "======================================"

# 生成常用命令文件
cat > /tmp/bt-commands.txt << 'EOF'
# 宝塔面板常用命令

## 服务管理
/etc/init.d/bt start      # 启动宝塔
/etc/init.d/bt stop       # 停止宝塔
/etc/init.d/bt restart    # 重启宝塔
/etc/init.d/bt status     # 查看状态

## 面板信息
bt default                # 查看面板入口信息
bt 14                     # 查看面板密码

## 密码重置
cd /www/server/panel && python tools.py panel 新密码   # 重置面板密码
cd /www/server/panel && python tools.py username 新用户名  # 修改用户名

## 端口修改
echo '8888' > /www/server/panel/data/port.pl  # 修改端口为8888
/etc/init.d/bt restart                        # 重启生效

## 关闭安全入口
rm -f /www/server/panel/data/admin_path.pl    # 关闭安全入口
/etc/init.d/bt restart                        # 重启生效

## 查看日志
tail -f /www/server/panel/logs/error.log      # 查看错误日志
tail -f /www/wwwlogs/access.log              # 查看访问日志

## 修复面板
wget -O update.sh http://download.bt.cn/install/update.sh && sh update.sh  # 修复/更新面板
EOF

echo -e "${GREEN}常用命令已保存到: /tmp/bt-commands.txt${NC}"

echo -e "\n${YELLOW}[步骤10] 检查网站服务${NC}"
echo "======================================"

# 检查网站目录
if [ -d "/www/wwwroot/learning-platform" ]; then
    echo -e "${GREEN}✅ 网站目录存在${NC}"
    
    # 检查Node.js服务
    if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
        echo -e "${GREEN}✅ Node.js后端在3001端口运行${NC}"
    elif netstat -tlnp 2>/dev/null | grep -q ":3002 "; then
        echo -e "${GREEN}✅ Node.js后端在3002端口运行${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js后端未运行${NC}"
        
        # 尝试启动
        if [ -f "/www/wwwroot/learning-platform/server/app.js" ]; then
            echo "尝试启动Node.js服务..."
            cd /www/wwwroot/learning-platform/server
            if command -v pm2 &> /dev/null; then
                pm2 start app.js --name learning-platform
                pm2 save
            else
                nohup node app.js > /var/log/learning-platform.log 2>&1 &
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠️  网站目录不存在${NC}"
fi

echo -e "\n======================================"
echo -e "${GREEN}诊断完成！${NC}"
echo "======================================"

# 最终状态汇总
echo -e "\n${BLUE}=== 最终状态汇总 ===${NC}"

# 宝塔面板状态
if ps aux | grep -v grep | grep -q "bt.py"; then
    echo -e "宝塔面板: ${GREEN}运行中${NC}"
else
    echo -e "宝塔面板: ${RED}未运行${NC}"
fi

# Nginx状态
if pgrep nginx > /dev/null; then
    echo -e "Nginx服务: ${GREEN}运行中${NC}"
else
    echo -e "Nginx服务: ${RED}未运行${NC}"
fi

# Node.js状态
if netstat -tlnp 2>/dev/null | grep -qE ":(3001|3002) "; then
    echo -e "Node.js后端: ${GREEN}运行中${NC}"
else
    echo -e "Node.js后端: ${RED}未运行${NC}"
fi

echo ""
echo "如需进一步帮助，请提供以下信息:"
echo "1. 能否ping通服务器: ping 47.109.142.72"
echo "2. 能否SSH登录服务器"
echo "3. 阿里云控制台安全组设置截图"





