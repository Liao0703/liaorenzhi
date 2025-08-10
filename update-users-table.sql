-- 更新用户表结构，添加新字段
-- 如果字段不存在则添加

-- 添加全名字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) DEFAULT NULL COMMENT '全名';

-- 添加工号字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20) DEFAULT NULL COMMENT '工号';

-- 添加单位字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company VARCHAR(100) DEFAULT NULL COMMENT '单位';

-- 添加班组字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS team VARCHAR(50) DEFAULT NULL COMMENT '班组';

-- 添加工种字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT NULL COMMENT '工种';

-- 更新现有用户数据，设置默认值
UPDATE users SET 
  company = '兴隆村车站',
  department = '白市驿车站'
WHERE company IS NULL OR department IS NULL;

-- 为现有用户添加示例数据
UPDATE users SET 
  full_name = name,
  employee_id = CASE 
    WHEN username = 'maintenance' THEN 'MAINT001'
    WHEN username = 'admin' THEN 'ADMIN001'
    WHEN username = 'user' THEN '10001'
    ELSE CONCAT('USR', LPAD(id, 3, '0'))
  END,
  team = '运转一班',
  job_type = '车站值班员'
WHERE full_name IS NULL OR employee_id IS NULL OR team IS NULL OR job_type IS NULL;

-- 显示更新后的表结构
DESCRIBE users;

-- 显示更新后的用户数据
SELECT id, username, name, full_name, role, employee_id, company, department, team, job_type, email, phone FROM users;