-- 修改文件相关字段的字符集（如果存在）

-- 检查哪些字段存在
SELECT COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'learning_platform' 
AND TABLE_NAME = 'articles'
AND COLUMN_NAME IN ('file_name', 'file_url', 'file_id', 'file_type', 'storage_type');

-- 如果file_name存在，修改它
-- ALTER TABLE articles MODIFY COLUMN file_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 如果file_url存在，修改它
-- ALTER TABLE articles MODIFY COLUMN file_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 如果file_id存在，修改它
-- ALTER TABLE articles MODIFY COLUMN file_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 如果file_type存在，修改它
-- ALTER TABLE articles MODIFY COLUMN file_type VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'none';

-- 如果storage_type存在，修改它
-- ALTER TABLE articles MODIFY COLUMN storage_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'local';




