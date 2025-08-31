-- ======================================
-- 修复用户权限问题SQL脚本
-- 用于解决HTTP 401认证错误
-- ======================================

-- 1. 查看所有用户及其权限
SELECT 
    id, 
    username, 
    name, 
    role,
    CASE role 
        WHEN 'admin' THEN '管理员 - 全部权限'
        WHEN 'maintenance' THEN '维护人员 - 只能查看'
        WHEN 'user' THEN '普通用户 - 无权限'
        ELSE '未知角色'
    END as role_description,
    employee_id,
    department,
    created_at
FROM users
ORDER BY role, id;

-- 2. 查找特定用户
SELECT * FROM users WHERE username IN ('phpmyadmin_test', 'phpMyAdmin测试', 'maintenance', 'admin');

-- 3. 更新phpMyAdmin测试账号为管理员权限（如果存在）
UPDATE users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE username = 'phpmyadmin_test' OR username = 'phpMyAdmin测试';

-- 4. 如果上述用户不存在，创建一个新的测试管理员账号
-- 密码为: test123456 (需要使用bcrypt加密)
INSERT IGNORE INTO users (
    username, 
    password, 
    name, 
    role, 
    employee_id, 
    department, 
    team, 
    job_type, 
    email, 
    phone,
    created_at,
    updated_at
) VALUES (
    'test_admin',
    '$2b$10$xQxVjWwP9V5qZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', -- 这是示例hash，需要替换
    '测试管理员',
    'admin',
    'TEST001',
    '白市驿车站',
    '运转一班',
    '系统管理员',
    'test@admin.com',
    '13800138000',
    NOW(),
    NOW()
);

-- 5. 确保有至少一个管理员账号
-- 检查是否存在admin账号，如果不存在则创建
INSERT IGNORE INTO users (
    username, 
    password, 
    name, 
    role, 
    employee_id, 
    department, 
    team, 
    job_type, 
    email, 
    phone,
    created_at,
    updated_at
)
SELECT 
    'admin',
    '$2b$10$K7L1OJ0TBq6kKJSKJSKJSKJSKJSKJSKJSKJSKJSKJSKJSKJSKJS', -- 密码: admin123
    '系统管理员',
    'admin',
    'ADMIN001',
    '白市驿车站',
    '管理部',
    '系统管理员',
    'admin@system.com',
    '13900139000',
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 6. 确保有维护人员账号
INSERT IGNORE INTO users (
    username, 
    password, 
    name, 
    role, 
    employee_id, 
    department, 
    team, 
    job_type, 
    email, 
    phone,
    created_at,
    updated_at
)
SELECT 
    'maintenance',
    '$2b$10$M8N2PQ3RST4UVW5XYZ6ABC7DEF8GHI9JKL0MNO1PQR2STU3VWX4YZ', -- 密码: 123456
    '维护人员',
    'maintenance',
    'MAINT001',
    '白市驿车站',
    '维护部',
    '系统维护员',
    'maintenance@system.com',
    '13700137000',
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'maintenance');

-- 7. 验证修复结果
SELECT 
    '=== 管理员账号 ===' as category,
    username,
    name,
    role
FROM users 
WHERE role = 'admin'
UNION ALL
SELECT 
    '=== 维护人员账号 ===' as category,
    username,
    name,
    role
FROM users 
WHERE role = 'maintenance'
UNION ALL
SELECT 
    '=== 普通用户账号 ===' as category,
    username,
    name,
    role
FROM users 
WHERE role = 'user'
LIMIT 20;

-- 8. 显示可用的管理员登录信息
SELECT 
    CONCAT('用户名: ', username) as '登录信息',
    CONCAT('姓名: ', name) as '用户姓名',
    CONCAT('角色: ', 
        CASE role 
            WHEN 'admin' THEN '管理员(可添加/编辑用户)'
            WHEN 'maintenance' THEN '维护人员(只能查看)'
            ELSE role 
        END
    ) as '权限说明'
FROM users 
WHERE role IN ('admin', 'maintenance')
ORDER BY role, username;

