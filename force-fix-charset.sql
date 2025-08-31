-- 强制修复所有级别的字符集问题
-- 重要：请备份数据库后再执行！

-- 1. 强制修改数据库字符集
ALTER DATABASE learning_platform 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 2. 强制修改articles表的字符集和排序规则
ALTER TABLE articles 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 3. 强制修改所有文本字段的字符集
ALTER TABLE articles 
MODIFY COLUMN id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN file_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN file_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 设置连接字符集
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 验证修复结果
SHOW CREATE TABLE articles\G

-- 6. 测试插入中文数据
INSERT INTO articles (id, title, content, category) 
VALUES ('test-charset', '测试中文标题', '测试中文内容', '测试分类');

-- 7. 查询测试数据
SELECT id, title, content, category 
FROM articles 
WHERE id = 'test-charset';

-- 8. 清理测试数据
DELETE FROM articles WHERE id = 'test-charset';

-- 9. 确认当前会话字符集
SELECT 
    @@character_set_client AS client_charset,
    @@character_set_connection AS connection_charset,
    @@character_set_results AS results_charset,
    @@character_set_database AS database_charset;




