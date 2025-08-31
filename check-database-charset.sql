-- 检查数据库字符集配置
-- 1. 检查数据库默认字符集
SELECT 
    SCHEMA_NAME,
    DEFAULT_CHARACTER_SET_NAME,
    DEFAULT_COLLATION_NAME
FROM 
    information_schema.SCHEMATA
WHERE 
    SCHEMA_NAME = 'learning_platform';

-- 2. 检查articles表的字符集
SELECT 
    TABLE_NAME,
    TABLE_COLLATION
FROM 
    information_schema.TABLES
WHERE 
    TABLE_SCHEMA = 'learning_platform'
    AND TABLE_NAME = 'articles';

-- 3. 检查articles表所有字段的字符集
SELECT 
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM 
    information_schema.COLUMNS
WHERE 
    TABLE_SCHEMA = 'learning_platform'
    AND TABLE_NAME = 'articles'
    AND (DATA_TYPE LIKE '%char%' OR DATA_TYPE LIKE '%text%');

-- 4. 检查服务器变量
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- 5. 检查当前会话的字符集
SELECT @@character_set_client, @@character_set_connection, @@character_set_results;




