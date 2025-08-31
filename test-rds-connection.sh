#!/bin/bash

echo "测试RDS连接..."
echo ""

# 1. 测试从服务器连接（应该成功）
echo "1. 从服务器测试连接RDS..."
ssh root@47.109.142.72 << 'TEST1'
echo "从服务器(47.109.142.72)连接..."
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 \
      -e "SELECT 'Connection from server: SUCCESS' as Result;" 2>&1 | head -5
TEST1

echo ""
echo "2. 测试直接连接（从本地）..."
# 测试能否ping通
ping -c 2 rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com

echo ""
echo "3. 测试telnet端口..."
# 测试端口是否开放
echo "quit" | telnet rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com 3306 2>&1 | head -10

echo ""
echo "4. 使用mysql客户端测试..."
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 \
      -e "SELECT 'Direct connection: SUCCESS' as Result;" 2>&1
