-- 最基础的修复方法
-- 不使用 IF NOT EXISTS，如果字段已存在会报错，但不影响后续执行

-- 1. 选择数据库
USE learning_platform;

-- 2. 先看看表里有哪些字段
SHOW COLUMNS FROM articles;

-- 3. 尝试添加字段（如果已存在会报错，忽略即可）
ALTER TABLE articles ADD COLUMN file_type VARCHAR(10) DEFAULT 'none';
ALTER TABLE articles ADD COLUMN file_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE articles ADD COLUMN file_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE articles ADD COLUMN file_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE articles ADD COLUMN storage_type VARCHAR(20) DEFAULT 'local';
ALTER TABLE articles ADD COLUMN required_reading_time INT DEFAULT 30;
ALTER TABLE articles ADD COLUMN status VARCHAR(20) DEFAULT 'published';
ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 4. 最重要的步骤：转换字符集
ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 测试
SELECT '字符集修复完成' AS message;




