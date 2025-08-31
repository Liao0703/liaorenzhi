-- 修复 articles 表结构和字符集
-- 分步执行，避免因字段不存在导致的错误

-- 1. 首先检查表结构
SHOW COLUMNS FROM articles;

-- 2. 添加缺失的文件相关字段（如果不存在）
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

-- 3. 修改数据库字符集
ALTER DATABASE learning_platform 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 4. 修改表的默认字符集
ALTER TABLE articles 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 5. 修改现有字段的字符集（只修改存在的字段）
-- 基本字段
ALTER TABLE articles 
MODIFY COLUMN id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. 修改文件相关字段的字符集（如果存在）
-- 使用存储过程来安全地修改可能不存在的字段
DELIMITER $$

DROP PROCEDURE IF EXISTS ModifyColumnIfExists$$
CREATE PROCEDURE ModifyColumnIfExists(
    IN tableName VARCHAR(255),
    IN columnName VARCHAR(255),
    IN columnDefinition VARCHAR(1000)
)
BEGIN
    IF EXISTS (
        SELECT * 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = tableName 
        AND COLUMN_NAME = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' MODIFY COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- 使用存储过程修改可能存在的字段
CALL ModifyColumnIfExists('articles', 'file_name', 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL');
CALL ModifyColumnIfExists('articles', 'file_url', 'VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL');
CALL ModifyColumnIfExists('articles', 'file_id', 'VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL');
CALL ModifyColumnIfExists('articles', 'file_type', 'VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT ''none''');
CALL ModifyColumnIfExists('articles', 'storage_type', 'VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT ''local''');
CALL ModifyColumnIfExists('articles', 'status', 'VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT ''published''');

-- 删除临时存储过程
DROP PROCEDURE IF EXISTS ModifyColumnIfExists;

-- 7. 再次查看表结构，确认修改成功
SHOW CREATE TABLE articles\G

-- 8. 测试中文数据插入
INSERT INTO articles (id, title, content, category, file_name, file_url) 
VALUES (
    'test-charset-fix', 
    '测试中文标题：安全培训规程', 
    '这是测试内容，包含各种中文字符：安全、设备、维护、应急处理等。', 
    '安全规程',
    '安全培训手册.pdf',
    '/api/files/download/test.pdf'
)
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    content = VALUES(content),
    file_name = VALUES(file_name);

-- 9. 查询测试数据
SELECT id, title, content, category, file_name, file_url 
FROM articles 
WHERE id = 'test-charset-fix';

-- 10. 清理测试数据（可选）
-- DELETE FROM articles WHERE id = 'test-charset-fix';

-- 11. 显示所有文章，检查是否有乱码
SELECT id, title, category, file_name 
FROM articles 
LIMIT 10;




