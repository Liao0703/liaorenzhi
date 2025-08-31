-- 修复数据库字符集和文件上传记录问题
-- 执行时间: 2025-01-23

-- 1. 修改数据库字符集
ALTER DATABASE learning_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 修复articles表字符集
ALTER TABLE articles 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 3. 修复各字段字符集
ALTER TABLE articles 
MODIFY id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 确保文件相关字段存在
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(10) DEFAULT 'none' COMMENT '文件类型: pdf, word, none',
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
ADD COLUMN IF NOT EXISTS file_id VARCHAR(100) DEFAULT NULL COMMENT '文件ID',
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型: local, oss, hybrid',
ADD COLUMN IF NOT EXISTS required_reading_time INT DEFAULT 30 COMMENT '要求阅读时间(分钟)';

-- 5. 修复其他相关表的字符集
ALTER TABLE users 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

ALTER TABLE learning_records 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 6. 查看修复后的表结构
SHOW CREATE TABLE articles;

-- 7. 输出完成信息
SELECT '数据库字符集修复完成！' AS status;


