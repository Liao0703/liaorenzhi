-- MySQL 8.1 完整修复脚本
-- 包含选择数据库和所有修复步骤

-- 1. 选择数据库（重要！）
USE learning_platform;

-- 2. 检查当前数据库
SELECT DATABASE();

-- 3. 添加缺失的字段（MySQL 8.1 支持 IF NOT EXISTS）
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(10) DEFAULT 'none' COMMENT '文件类型: pdf, word, none',
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
ADD COLUMN IF NOT EXISTS file_id VARCHAR(100) DEFAULT NULL COMMENT '文件ID',
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型: local, oss, hybrid',
ADD COLUMN IF NOT EXISTS required_reading_time INT DEFAULT 30 COMMENT '要求阅读时间(分钟)',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published' COMMENT '文章状态',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 4. 修改数据库字符集
ALTER DATABASE learning_platform 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 5. 修改表的默认字符集
ALTER TABLE articles 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 6. 转换所有字段到utf8mb4
ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. 查看表结构
SHOW CREATE TABLE articles\G

-- 8. 查看所有字段的字符集
SELECT 
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME,
    DATA_TYPE
FROM 
    information_schema.COLUMNS
WHERE 
    TABLE_SCHEMA = 'learning_platform'
    AND TABLE_NAME = 'articles'
    AND (DATA_TYPE LIKE '%char%' OR DATA_TYPE LIKE '%text%');

-- 9. 测试中文数据插入
INSERT INTO articles (id, title, content, category, file_name) 
VALUES (
    'test-mysql8-charset', 
    '测试MySQL8中文：安全规程培训', 
    '这是测试内容，包含各种中文字符：设备维护、应急处理、信号系统等。', 
    '安全规程',
    '安全培训手册2025.pdf'
) ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    content = VALUES(content),
    file_name = VALUES(file_name);

-- 10. 查询测试结果
SELECT id, title, content, category, file_name 
FROM articles 
WHERE id = 'test-mysql8-charset';

-- 11. 查看最近的文章（检查是否有乱码）
SELECT id, title, category, file_name, created_at 
FROM articles 
ORDER BY created_at DESC 
LIMIT 5;

-- 12. 清理测试数据（可选）
-- DELETE FROM articles WHERE id = 'test-mysql8-charset';

-- 13. 确认字符集设置
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';




