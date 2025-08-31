-- 修复 learning_records 表结构
-- 添加缺失的字段

-- 1. 检查并添加 study_time 字段
ALTER TABLE learning_records 
ADD COLUMN IF NOT EXISTS `study_time` INT DEFAULT 0 COMMENT '学习时长（分钟）' 
AFTER `article_id`;

-- 2. 检查并添加 score 字段
ALTER TABLE learning_records 
ADD COLUMN IF NOT EXISTS `score` INT DEFAULT 0 COMMENT '测试成绩' 
AFTER `study_time`;

-- 3. 检查并添加 completed 字段
ALTER TABLE learning_records 
ADD COLUMN IF NOT EXISTS `completed` TINYINT DEFAULT 0 COMMENT '是否完成' 
AFTER `score`;

-- 4. 检查并添加 completed_at 字段
ALTER TABLE learning_records 
ADD COLUMN IF NOT EXISTS `completed_at` DATETIME NULL COMMENT '完成时间' 
AFTER `completed`;

-- 5. 检查并添加 updated_at 字段
ALTER TABLE learning_records 
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
AFTER `created_at`;

-- 6. 添加必要的索引
ALTER TABLE learning_records ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);
ALTER TABLE learning_records ADD INDEX IF NOT EXISTS `idx_article_id` (`article_id`);
ALTER TABLE learning_records ADD INDEX IF NOT EXISTS `idx_completed` (`completed`);
ALTER TABLE learning_records ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- 验证修改结果
DESC learning_records;
