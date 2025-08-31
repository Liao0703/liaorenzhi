-- 测试字符集修复效果

-- 1. 插入测试数据
INSERT INTO articles (id, title, content, category) 
VALUES (
    'charset-test-2025', 
    '中文测试：安全规程培训资料', 
    '这是一个测试内容，包含各种中文字符：培训、安全、设备维护、应急处理、信号系统、调度规范等。', 
    '安全规程'
);

-- 2. 查询刚插入的数据
SELECT id, title, content, category 
FROM articles 
WHERE id = 'charset-test-2025';

-- 3. 查看所有文章标题（检查是否有乱码）
SELECT id, title, category 
FROM articles 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. 清理测试数据（执行完测试后）
-- DELETE FROM articles WHERE id = 'charset-test-2025';




