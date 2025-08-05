#!/bin/bash

echo "🔑 配置 SSH 密钥到云服务器"
echo "========================"

CLOUD_IP="116.62.65.246"
CLOUD_USER="root"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 目标服务器: $CLOUD_IP${NC}"

# 检查 SSH 密钥
echo -e "${YELLOW}🔍 检查 SSH 密钥...${NC}"
if [ ! -f ~/.ssh/id_rsa ]; then
    echo -e "${RED}❌ 未找到 SSH 私钥${NC}"
    echo -e "${YELLOW}正在生成 SSH 密钥...${NC}"
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
fi

echo -e "${GREEN}✅ SSH 密钥已准备${NC}"

# 显示公钥内容
echo -e "${YELLOW}📋 公钥内容:${NC}"
cat ~/.ssh/id_rsa.pub

echo ""
echo -e "${YELLOW}🔐 请输入云服务器密码来配置 SSH 密钥:${NC}"
read -s CLOUD_PASSWORD

# 使用 expect 配置 SSH 密钥
cat > setup_key.exp << EOF
#!/usr/bin/expect -f

set timeout 30
set ip "$CLOUD_IP"
set user "$CLOUD_USER"
set password "$CLOUD_PASSWORD"

# 复制公钥到服务器
spawn ssh-copy-id \$user@\$ip
expect {
    "password:" {
        send "\$password\r"
        expect eof
    }
    "Permission denied" {
        puts "密码错误或服务器不允许密码登录"
        exit 1
    }
    timeout {
        puts "连接超时"
        exit 1
    }
}
EOF

chmod +x setup_key.exp

echo -e "${YELLOW}🔧 配置 SSH 密钥...${NC}"
./setup_key.exp

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSH 密钥配置成功！${NC}"
    
    # 测试 SSH 连接
    echo -e "${YELLOW}🔍 测试 SSH 连接...${NC}"
    if ssh -o ConnectTimeout=5 -o BatchMode=yes $CLOUD_USER@$CLOUD_IP exit 2>/dev/null; then
        echo -e "${GREEN}✅ SSH 连接测试成功！${NC}"
        echo -e "${GREEN}现在可以使用 SSH 密钥登录云服务器了${NC}"
    else
        echo -e "${RED}❌ SSH 连接测试失败${NC}"
    fi
else
    echo -e "${RED}❌ SSH 密钥配置失败${NC}"
    echo -e "${YELLOW}请手动配置:${NC}"
    echo -e "${YELLOW}1. 复制公钥内容到云服务器的 ~/.ssh/authorized_keys${NC}"
    echo -e "${YELLOW}2. 确保云服务器允许公钥认证${NC}"
fi

# 清理
rm -f setup_key.exp 