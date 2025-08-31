-- 查看所有注册的用户账号
-- 在阿里云DMS中执行以下SQL语句

-- 1. 查看所有用户（不显示密码）
SELECT 
    id AS '用户ID',
    username AS '用户名',
    name AS '姓名',
    role AS '角色',
    email AS '邮箱',
    job_type AS '工种',
    created_at AS '注册时间',
    updated_at AS '更新时间'
FROM users
ORDER BY id DESC;

-- 2. 统计用户数量
SELECT 
    COUNT(*) AS '总用户数',
    COUNT(CASE WHEN role = 'admin' THEN 1 END) AS '管理员数量',
    COUNT(CASE WHEN role = 'user' THEN 1 END) AS '普通用户数量',
    COUNT(CASE WHEN role = 'maintenance' THEN 1 END) AS '维护人员数量'
FROM users;

-- 3. 查看最近注册的10个用户
SELECT 
    id,
    username,
    name,
    role,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS '注册时间'
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 4. 查看特定用户（替换username为实际用户名）
-- SELECT * FROM users WHERE username = 'your_username';

-- 5. 查看管理员账号
SELECT 
    id,
    username,
    name,
    email,
    created_at
FROM users
WHERE role = 'admin'
ORDER BY id;

-- 6. 查看今天注册的用户
SELECT 
    id,
    username,
    name,
    role,
    TIME(created_at) AS '注册时间'
FROM users
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- 7. 按角色分组查看
SELECT 
    role AS '用户角色',
    COUNT(*) AS '数量',
    GROUP_CONCAT(username SEPARATOR ', ') AS '用户名列表'
FROM users
GROUP BY role;

-- 8. 查看用户的学习记录统计
SELECT 
    u.username AS '用户名',
    u.name AS '姓名',
    COUNT(lr.id) AS '学习记录数',
    MAX(lr.last_read_at) AS '最后学习时间'
FROM users u
LEFT JOIN learning_records lr ON u.id = lr.user_id
GROUP BY u.id
ORDER BY COUNT(lr.id) DESC;

