-- 兼容旧版本MySQL的修复脚本
-- 分步执行每个语句

-- 步骤1: 检查当前表结构
DESCRIBE articles;

-- 步骤2: 创建存储过程来安全添加字段
DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(64),
    IN columnName VARCHAR(64),
    IN columnDefinition VARCHAR(1000)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND COLUMN_NAME = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- 步骤3: 使用存储过程添加字段
CALL AddColumnIfNotExists('articles', 'file_type', 'VARCHAR(10) DEFAULT ''none''');
CALL AddColumnIfNotExists('articles', 'file_url', 'VARCHAR(500) DEFAULT NULL');
CALL AddColumnIfNotExists('articles', 'file_name', 'VARCHAR(255) DEFAULT NULL');
CALL AddColumnIfNotExists('articles', 'file_id', 'VARCHAR(100) DEFAULT NULL');
CALL AddColumnIfNotExists('articles', 'storage_type', 'VARCHAR(20) DEFAULT ''local''');
CALL AddColumnIfNotExists('articles', 'required_reading_time', 'INT DEFAULT 30');
CALL AddColumnIfNotExists('articles', 'status', 'VARCHAR(20) DEFAULT ''published''');
CALL AddColumnIfNotExists('articles', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('articles', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- 步骤4: 删除存储过程
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- 步骤5: 修改数据库字符集
ALTER DATABASE learning_platform 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 步骤6: 修改表字符集
ALTER TABLE articles 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 步骤7: 查看更新后的表结构
SHOW CREATE TABLE articles;




