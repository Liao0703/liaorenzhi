-- 为文章表添加工种分配字段
-- 执行时间: 2025-01-19

-- 添加工种分配字段 - 使用JSON格式存储允许访问的工种列表
ALTER TABLE `articles` 
ADD COLUMN `allowed_job_types` JSON DEFAULT NULL 
COMMENT '允许访问的工种列表，JSON格式存储，为NULL表示所有工种都可访问';

-- 添加索引以提高查询性能
ALTER TABLE `articles` 
ADD INDEX `idx_allowed_job_types` ((`allowed_job_types`));

-- 更新现有文章为默认允许所有工种访问
UPDATE `articles` 
SET `allowed_job_types` = NULL 
WHERE `allowed_job_types` IS NULL;

-- 输出完成信息
SELECT 'Job types column added successfully to articles table!' AS status;

-- 工种列表参考（可根据实际需要调整）
-- 当前支持的工种：
-- - 车站值班员
-- - 助理值班员（内勤）  
-- - 助理值班员（外勤）
-- - 连结员
-- - 调车长
-- - 列尾作业员
-- - 站调
-- - 车号员

-- 示例：为特定工种分配文章
-- UPDATE articles SET allowed_job_types = '["车站值班员", "助理值班员（内勤）"]' WHERE id = 'article_id';

-- 示例：查询特定工种可以访问的文章
-- SELECT * FROM articles 
-- WHERE allowed_job_types IS NULL 
--    OR JSON_CONTAINS(allowed_job_types, '"车站值班员"');





