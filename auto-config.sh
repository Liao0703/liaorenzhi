#!/bin/bash

echo "🤖 自动配置云服务器"
echo "=================="

CLOUD_IP="116.62.65.246"
CLOUD_USER="root"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌐 目标服务器: $CLOUD_IP${NC}"

# 提示用户输入密码
echo -e "${YELLOW}🔐 请输入云服务器密码:${NC}"
read -s CLOUD_PASSWORD

# 创建 expect 脚本来自动配置
cat > auto_config.exp << EOF
#!/usr/bin/expect -f

set timeout 30
set ip "$CLOUD_IP"
set user "$CLOUD_USER"
set password "$CLOUD_PASSWORD"

# 登录并配置 SSH
spawn ssh \$user@\$ip
expect {
    "password:" {
        send "\$password\r"
        expect "\$ "
        
        # 创建 SSH 目录
        send "mkdir -p ~/.ssh\r"
        expect "\$ "
        send "chmod 700 ~/.ssh\r"
        expect "\$ "
        
        # 添加公钥
        send "echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys\r"
        expect "\$ "
        send "chmod 600 ~/.ssh/authorized_keys\r"
        expect "\$ "
        
        # 检查 SSH 配置
        send "sudo grep -E 'PasswordAuthentication|PubkeyAuthentication' /etc/ssh/sshd_config\r"
        expect "\$ "
        
        # 重启 SSH 服务
        send "sudo systemctl restart sshd\r"
        expect "\$ "
        
        # 测试 SSH 密钥登录
        send "exit\r"
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

chmod +x auto_config.exp

echo -e "${YELLOW}🔧 自动配置 SSH 密钥...${NC}"
./auto_config.exp

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSH 密钥配置成功！${NC}"
    
    # 测试 SSH 连接
    echo -e "${YELLOW}🔍 测试 SSH 连接...${NC}"
    if ssh -o ConnectTimeout=5 -o BatchMode=yes $CLOUD_USER@$CLOUD_IP exit 2>/dev/null; then
        echo -e "${GREEN}✅ SSH 连接测试成功！${NC}"
        
        # 现在可以自动同步了
        echo -e "${YELLOW}🚀 开始自动同步...${NC}"
        ./sync-with-key.sh
    else
        echo -e "${RED}❌ SSH 连接测试失败${NC}"
        echo -e "${YELLOW}请检查云服务器配置${NC}"
    fi
else
    echo -e "${RED}❌ SSH 密钥配置失败${NC}"
fi

# 清理
rm -f auto_config.exp 