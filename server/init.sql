-- 兴站智训通数据库初始化脚本
-- 创建时间: 2025-01-19

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('admin','user','maintenance') NOT NULL DEFAULT 'user',
  `employee_id` varchar(20) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `team` varchar(100) DEFAULT NULL,
  `job_type` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建文章表
CREATE TABLE IF NOT EXISTS `articles` (
  `id` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` longtext NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `difficulty` enum('easy','medium','hard') DEFAULT 'medium',
  `estimated_time` int(11) DEFAULT 0 COMMENT '预估学习时间(分钟)',
  `quiz_data` json DEFAULT NULL COMMENT '测试题数据',
  `status` enum('draft','published','archived') DEFAULT 'published',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建学习记录表
CREATE TABLE IF NOT EXISTS `learning_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `article_id` varchar(50) NOT NULL,
  `reading_time` int(11) DEFAULT 0 COMMENT '阅读时间(秒)',
  `completion_rate` decimal(3,2) DEFAULT 0.00 COMMENT '完成率(0-1)',
  `quiz_score` decimal(5,2) DEFAULT NULL COMMENT '测试得分',
  `quiz_data` json DEFAULT NULL COMMENT '测试答题记录',
  `photos_taken` int(11) DEFAULT 0 COMMENT '拍摄照片数量',
  `learning_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_article_date` (`user_id`,`article_id`,`learning_date`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_learning_date` (`learning_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建文件上传记录表
CREATE TABLE IF NOT EXISTS `uploaded_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `upload_type` enum('document','image','video','other') DEFAULT 'document',
  `related_article` varchar(50) DEFAULT NULL,
  `processing_status` enum('pending','processed','failed') DEFAULT 'processed',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_upload_type` (`upload_type`),
  KEY `idx_related_article` (`related_article`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL UNIQUE,
  `config_value` text NOT NULL,
  `config_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `operation` varchar(100) NOT NULL,
  `resource_type` varchar(50) NOT NULL,
  `resource_id` varchar(100) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_operation` (`operation`),
  KEY `idx_resource_type` (`resource_type`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123456)
INSERT IGNORE INTO `users` (`username`, `password`, `name`, `full_name`, `role`, `employee_id`, `company`, `department`, `team`, `job_type`, `email`) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', '系统管理员', 'admin', 'ADMIN001', '系统管理', '技术部', '运维组', '系统管理员', 'admin@learning-platform.com');

-- 插入演示用户 (密码: demo123456)
INSERT IGNORE INTO `users` (`username`, `password`, `name`, `full_name`, `role`, `employee_id`, `company`, `department`, `team`, `job_type`, `email`) 
VALUES ('demo', '$2a$10$xn3LI/AjqicNfH0lRQCKl.PBz2neMVhGm9lQSMYgNwCLfPY7LRdFy', '演示用户', '演示用户', 'user', 'DEMO001', '演示公司', '演示部门', '演示班组', '车站值班员', 'demo@learning-platform.com');

-- 插入维护用户 (密码: maintenance123456)
INSERT IGNORE INTO `users` (`username`, `password`, `name`, `full_name`, `role`, `employee_id`, `company`, `department`, `team`, `job_type`, `email`) 
VALUES ('maintenance', '$2a$10$vC8Z0A6Pb1Q0rKGF3FP0Lu5N7JOm4B6K9VjJ5S9BcPcZN2Z8F7YcC', '维护用户', '维护用户', 'maintenance', 'MAINT001', '维护中心', '维护部', '设备组', '设备维护员', 'maintenance@learning-platform.com');

-- 插入默认系统配置
INSERT IGNORE INTO `system_config` (`config_key`, `config_value`, `config_type`, `description`) VALUES
('system_name', '兴站智训通', 'string', '系统名称'),
('system_version', '1.0.0', 'string', '系统版本'),
('maintenance_mode', 'false', 'boolean', '维护模式开关'),
('max_file_size', '50', 'number', '最大文件上传大小(MB)'),
('session_timeout', '1440', 'number', '会话超时时间(分钟)'),
('learning_reminder', 'true', 'boolean', '学习提醒开关'),
('photo_required', 'true', 'boolean', '是否必须拍照'),
('quiz_enabled', 'true', 'boolean', '是否启用测试功能');

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_records_user_date ON learning_records(user_id, learning_date);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_type ON uploaded_files(user_id, upload_type);

-- 设置外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 创建视图：用户学习统计
CREATE OR REPLACE VIEW user_learning_stats AS
SELECT 
    u.id,
    u.username,
    u.name,
    u.company,
    u.department,
    u.team,
    COUNT(lr.id) as total_records,
    AVG(lr.completion_rate) as avg_completion_rate,
    AVG(lr.quiz_score) as avg_quiz_score,
    SUM(lr.reading_time) as total_reading_time,
    MAX(lr.learning_date) as last_learning_date
FROM users u
LEFT JOIN learning_records lr ON u.id = lr.user_id
WHERE u.role != 'maintenance'
GROUP BY u.id, u.username, u.name, u.company, u.department, u.team;

-- 创建存储过程：清理过期数据
DELIMITER //
CREATE PROCEDURE CleanupExpiredData()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 清理6个月前的操作日志
    DELETE FROM operation_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
    
    -- 清理临时文件记录（1个月前且处理失败的）
    DELETE FROM uploaded_files 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH) 
    AND processing_status = 'failed';
    
    COMMIT;
    SELECT 'Expired data cleanup completed' AS result;
END //
DELIMITER ;

-- 输出初始化完成信息
SELECT 'Database initialization completed successfully!' AS status;
