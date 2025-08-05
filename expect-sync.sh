#!/bin/bash

echo "🤖 自动同步到云服务器"
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

# 1. 构建项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build

# 2. 创建临时同步目录
TEMP_DIR="temp-sync"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# 复制文件
cp -r dist $TEMP_DIR/
cp server.js $TEMP_DIR/
cp package.json $TEMP_DIR/

# 3. 提示用户输入密码
echo -e "${YELLOW}🔐 请输入云服务器密码:${NC}"
read -s CLOUD_PASSWORD

# 4. 创建 expect 脚本
cat > sync.exp << EOF
#!/usr/bin/expect -f

set timeout 30
set ip "$CLOUD_IP"
set user "$CLOUD_USER"
set password "$CLOUD_PASSWORD"

# 上传文件
spawn scp -r temp-sync/* \$user@\$ip:/root/learning-platform/
expect {
    "password:" {
        send "\$password\r"
        expect eof
    }
    "Permission denied" {
        puts "密码错误"
        exit 1
    }
    timeout {
        puts "连接超时"
        exit 1
    }
}

# 远程执行命令
spawn ssh \$user@\$ip
expect {
    "password:" {
        send "\$password\r"
        expect "\$ "
        send "cd /root/learning-platform\r"
        expect "\$ "
        send "pkill -f 'node server.js' || true\r"
        expect "\$ "
        send "sleep 2\r"
        expect "\$ "
        send "npm install --production\r"
        expect "\$ "
        send "nohup node server.js > app.log 2>&1 &\r"
        expect "\$ "
        send "sleep 3\r"
        expect "\$ "
        send "curl -s http://localhost:3000/health\r"
        expect "\$ "
        send "exit\r"
        expect eof
    }
    "Permission denied" {
        puts "密码错误"
        exit 1
    }
    timeout {
        puts "连接超时"
        exit 1
    }
}
EOF

chmod +x sync.exp

# 5. 执行 expect 脚本
echo -e "${YELLOW}📤 上传并启动服务...${NC}"
./sync.exp

# 6. 清理
rm -f sync.exp
rm -rf $TEMP_DIR

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 同步完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://$CLOUD_IP:3000${NC}"
echo -e "${GREEN}🔧 健康检查: http://$CLOUD_IP:3000/health${NC}"
echo -e "${GREEN}================================${NC}"

# 7. 验证同步结果
echo -e "${YELLOW}🔍 验证同步结果...${NC}"
sleep 3
./check-cloud-status.sh 