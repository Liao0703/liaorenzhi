#!/bin/bash
echo "正在连接服务器查看用户数据..."
ssh root@47.109.142.72 << 'REMOTE'
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 learning_platform \
      -e "SELECT id, username, name, role, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_time FROM users ORDER BY id DESC LIMIT 20;" 2>/dev/null
REMOTE
