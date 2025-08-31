-- 核心字符集修复
-- 只执行最关键的步骤

-- 1. 选择数据库
USE learning_platform;

-- 2. 转换整个表的字符集（这会自动转换所有字段）
ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 修改数据库默认字符集
ALTER DATABASE learning_platform CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4. 测试中文
INSERT INTO articles (id, title, content, category) 
VALUES ('test-core', '核心测试：中文标题', '测试内容：安全规程、设备维护', '测试分类')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 5. 查看结果
SELECT * FROM articles WHERE id = 'test-core';

-- 6. 显示字符集
SHOW VARIABLES LIKE '%character%';
SHOW VARIABLES LIKE '%collation%';




