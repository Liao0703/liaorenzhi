-- 最安全的修复方式：逐个字段修改

-- 1. 修改id字段
ALTER TABLE articles 
MODIFY COLUMN id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 修改title字段
ALTER TABLE articles 
MODIFY COLUMN title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 修改content字段
ALTER TABLE articles 
MODIFY COLUMN content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 修改category字段
ALTER TABLE articles 
MODIFY COLUMN category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 查看修改后的结果
SELECT 
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM 
    information_schema.COLUMNS
WHERE 
    TABLE_SCHEMA = 'learning_platform'
    AND TABLE_NAME = 'articles'
    AND COLUMN_NAME IN ('id', 'title', 'content', 'category');




