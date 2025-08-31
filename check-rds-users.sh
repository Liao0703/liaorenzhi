#!/bin/bash
echo "请输入服务器密码查看阿里云RDS用户："
ssh root@47.109.142.72 "mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com -u admin123 -pLiao0820 learning_platform -e 'SELECT id, username, name, role, created_at FROM users ORDER BY id DESC LIMIT 20;'"
