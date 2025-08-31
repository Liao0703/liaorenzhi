-- 最简单的修复方法
-- 请逐条执行，如果某条报错就跳过

-- 1. 先查看现有字段
SHOW COLUMNS FROM articles;

-- 2. 尝试添加file_type字段（如果报错说字段已存在，就跳过）
ALTER TABLE articles ADD COLUMN file_type VARCHAR(10) DEFAULT 'none';

-- 3. 尝试添加file_url字段
ALTER TABLE articles ADD COLUMN file_url VARCHAR(500) DEFAULT NULL;

-- 4. 尝试添加file_name字段
ALTER TABLE articles ADD COLUMN file_name VARCHAR(255) DEFAULT NULL;

-- 5. 尝试添加file_id字段
ALTER TABLE articles ADD COLUMN file_id VARCHAR(100) DEFAULT NULL;

-- 6. 尝试添加storage_type字段
ALTER TABLE articles ADD COLUMN storage_type VARCHAR(20) DEFAULT 'local';

-- 7. 尝试添加required_reading_time字段
ALTER TABLE articles ADD COLUMN required_reading_time INT DEFAULT 30;

-- 8. 尝试添加status字段
ALTER TABLE articles ADD COLUMN status VARCHAR(20) DEFAULT 'published';

-- 9. 尝试添加created_at字段
ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 10. 尝试添加updated_at字段
ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 11. 修改整个表的字符集（这个应该能成功）
ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 12. 再次查看表结构
SHOW COLUMNS FROM articles;




