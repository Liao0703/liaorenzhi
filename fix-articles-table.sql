-- 修复 articles 表结构
-- 添加缺失的字段以支持文件上传和完整的文章管理功能

-- 添加所需字段到 articles 表
ALTER TABLE `articles` 
ADD COLUMN IF NOT EXISTS `required_reading_time` int(11) DEFAULT 30 COMMENT '要求阅读时间(分钟)' AFTER `estimated_time`,
ADD COLUMN IF NOT EXISTS `file_type` enum('pdf','word','none') DEFAULT 'none' COMMENT '文件类型' AFTER `quiz_data`,
ADD COLUMN IF NOT EXISTS `file_url` varchar(500) DEFAULT NULL COMMENT '文件URL' AFTER `file_type`,
ADD COLUMN IF NOT EXISTS `file_name` varchar(255) DEFAULT NULL COMMENT '原始文件名' AFTER `file_url`,
ADD COLUMN IF NOT EXISTS `file_id` varchar(100) DEFAULT NULL COMMENT '文件ID' AFTER `file_name`,
ADD COLUMN IF NOT EXISTS `storage_type` enum('local','oss','hybrid') DEFAULT 'local' COMMENT '存储类型' AFTER `file_id`;

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_articles_file_type ON articles(file_type);
CREATE INDEX IF NOT EXISTS idx_articles_storage_type ON articles(storage_type);
CREATE INDEX IF NOT EXISTS idx_articles_required_reading_time ON articles(required_reading_time);

-- 如果 estimated_time 为空，则使用 required_reading_time 的值
UPDATE `articles` 
SET `required_reading_time` = COALESCE(`estimated_time`, 30) 
WHERE `required_reading_time` IS NULL OR `required_reading_time` = 0;

-- 输出完成信息
SELECT 'Articles table structure updated successfully!' AS status;
