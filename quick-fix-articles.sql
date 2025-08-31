-- 快速修复 articles 表的字符集问题
-- 分步执行，避免错误

-- 步骤1: 先添加缺失的字段
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(10) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_id VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS required_reading_time INT DEFAULT 30;

-- 步骤2: 修改表的字符集
ALTER TABLE articles 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 步骤3: 只修改基本字段的字符集（这些字段肯定存在）
ALTER TABLE articles 
MODIFY COLUMN id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 步骤4: 查看表结构
SHOW CREATE TABLE articles;




