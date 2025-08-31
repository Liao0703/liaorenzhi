#!/bin/bash

# 在服务器上查询RDS用户
SERVER="47.109.142.72"

echo "通过服务器查询阿里云RDS用户..."
echo "请输入服务器密码："

ssh root@$SERVER << 'QUERY'
echo "连接到阿里云RDS查询用户..."

mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 \
      -pLiao0820 \
      learning_platform << SQL
      
SELECT '========== 用户统计 ==========' as '';
SELECT COUNT(*) as '总用户数' FROM users;

SELECT '========== 角色分布 ==========' as '';
SELECT role as '角色', COUNT(*) as '数量' 
FROM users 
GROUP BY role;

SELECT '========== 最近注册的10个用户 ==========' as '';
SELECT 
    id as 'ID',
    username as '用户名',
    name as '姓名',
    role as '角色',
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as '注册时间'
FROM users 
ORDER BY id DESC 
LIMIT 10;

SELECT '========== 今日注册用户 ==========' as '';
SELECT 
    id as 'ID',
    username as '用户名',
    name as '姓名'
FROM users 
WHERE DATE(created_at) = CURDATE()
ORDER BY id DESC;

SQL

echo ""
echo "查询完成！"
QUERY
