-- 第一步：创建基础表
-- 在DMS中执行这个脚本

-- 1. 创建学习记录表
CREATE TABLE IF NOT EXISTS `learning_records` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `article_id` INT NOT NULL,
    `study_time` INT DEFAULT 0 COMMENT '学习时长（分钟）',
    `score` INT DEFAULT 0 COMMENT '测试成绩',
    `completed` TINYINT DEFAULT 0 COMMENT '是否完成',
    `completed_at` DATETIME NULL COMMENT '完成时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_article_id` (`article_id`),
    INDEX `idx_completed` (`completed`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习记录表';

-- 2. 创建用户活动日志表
CREATE TABLE IF NOT EXISTS `user_activities` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `activity_type` VARCHAR(50) NOT NULL COMMENT '活动类型：login, start_learning, complete_article, take_quiz',
    `article_id` INT NULL,
    `details` JSON NULL COMMENT '活动详情',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_activity_type` (`activity_type`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户活动日志表';

-- 3. 创建每日统计汇总表
CREATE TABLE IF NOT EXISTS `daily_statistics` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `stat_date` DATE NOT NULL,
    `total_users` INT DEFAULT 0,
    `active_users` INT DEFAULT 0,
    `new_users` INT DEFAULT 0,
    `total_articles` INT DEFAULT 0,
    `completed_articles` INT DEFAULT 0,
    `total_study_time` INT DEFAULT 0 COMMENT '总学习时长（分钟）',
    `average_score` DECIMAL(5,2) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_stat_date` (`stat_date`),
    INDEX `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计汇总表';

-- 4. 创建部门统计表
CREATE TABLE IF NOT EXISTS `department_statistics` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `department` VARCHAR(100) NOT NULL,
    `user_count` INT DEFAULT 0,
    `active_user_count` INT DEFAULT 0,
    `avg_study_time` DECIMAL(10,2) DEFAULT 0,
    `avg_score` DECIMAL(5,2) DEFAULT 0,
    `completion_rate` DECIMAL(5,2) DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_department` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门统计表';

-- 5. 创建工种统计表
CREATE TABLE IF NOT EXISTS `job_type_statistics` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `job_type` VARCHAR(100) NOT NULL,
    `user_count` INT DEFAULT 0,
    `active_user_count` INT DEFAULT 0,
    `avg_study_time` DECIMAL(10,2) DEFAULT 0,
    `avg_score` DECIMAL(5,2) DEFAULT 0,
    `completion_rate` DECIMAL(5,2) DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_job_type` (`job_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工种统计表';

