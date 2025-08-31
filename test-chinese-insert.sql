-- 测试中文插入是否正常

-- 1. 插入测试数据
INSERT INTO articles (id, title, content, category) 
VALUES ('test-2025-01', '测试标题：安全规程', '测试内容：这是中文内容', '安全培训');

-- 2. 查询测试数据
SELECT * FROM articles WHERE id = 'test-2025-01';

-- 3. 如果file_name字段存在，测试文件名
UPDATE articles 
SET file_name = '安全培训手册.pdf', 
    file_url = '/uploads/安全培训手册.pdf'
WHERE id = 'test-2025-01';

-- 4. 再次查询
SELECT id, title, category, file_name FROM articles WHERE id = 'test-2025-01';

-- 5. 清理（可选）
-- DELETE FROM articles WHERE id = 'test-2025-01';




