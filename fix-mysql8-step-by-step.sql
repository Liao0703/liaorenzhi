-- MySQL 8.1 逐步修复脚本
-- 每次只添加一个字段，避免语法错误

-- 1. 选择数据库
USE learning_platform;

-- 2. 逐个添加字段（每个都是独立的ALTER语句）
ALTER TABLE articles ADD COLUMN IF NOT EXISTS file_type VARCHAR(10) DEFAULT 'none' COMMENT '文件类型: pdf, word, none';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL COMMENT '文件URL';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL COMMENT '原始文件名';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS file_id VARCHAR(100) DEFAULT NULL COMMENT '文件ID';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型: local, oss, hybrid';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS required_reading_time INT DEFAULT 30 COMMENT '要求阅读时间(分钟)';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published' COMMENT '文章状态';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 3. 修改数据库字符集
ALTER DATABASE learning_platform CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4. 转换表的字符集（这是最重要的！）
ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 查看表结构
DESCRIBE articles;

-- 6. 测试中文插入
INSERT INTO articles (id, title, content, category, file_name) 
VALUES (
    'test-charset-2025', 
    '测试中文标题：安全培训规程', 
    '这是测试内容，包含中文：设备维护、应急处理、信号系统、调度规范等。', 
    '安全规程',
    '安全培训手册.pdf'
) ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    content = VALUES(content),
    file_name = VALUES(file_name);

-- 7. 查询测试数据
SELECT id, title, content, category, file_name 
FROM articles 
WHERE id = 'test-charset-2025';

-- 8. 查看字符集信息
SELECT 
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM 
    information_schema.COLUMNS
WHERE 
    TABLE_SCHEMA = 'learning_platform'
    AND TABLE_NAME = 'articles'
    AND COLUMN_NAME IN ('title', 'content', 'category', 'file_name');




