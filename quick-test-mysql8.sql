-- 快速测试脚本
-- 确保选择了正确的数据库

-- 1. 选择数据库
USE learning_platform;

-- 2. 显示当前数据库
SELECT DATABASE() AS current_database;

-- 3. 快速添加所有缺失字段（MySQL 8.1 语法）
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(10) DEFAULT 'none';

-- 4. 转换表字符集（最重要！）
ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 测试中文
INSERT INTO articles (id, title, content, category) 
VALUES ('quick-test', '快速测试中文', '测试内容', '测试')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 6. 查看结果
SELECT * FROM articles WHERE id = 'quick-test';




