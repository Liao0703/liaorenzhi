-- 创建管理员概览界面所需的数据库表和视图
-- 用于云数据库的统计功能

-- 1. 创建学习记录表（如果不存在）
CREATE TABLE IF NOT EXISTS learning_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    article_id INT NOT NULL,
    study_time INT DEFAULT 0 COMMENT '学习时长（分钟）',
    score INT DEFAULT 0 COMMENT '测试成绩',
    completed TINYINT DEFAULT 0 COMMENT '是否完成',
    completed_at DATETIME NULL COMMENT '完成时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_article_id (article_id),
    INDEX idx_completed (completed),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 创建用户活动日志表
CREATE TABLE IF NOT EXISTS user_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL COMMENT '活动类型：login, start_learning, complete_article, take_quiz',
    article_id INT NULL,
    details JSON NULL COMMENT '活动详情',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建每日统计汇总表（用于性能优化）
CREATE TABLE IF NOT EXISTS daily_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL,
    total_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    total_articles INT DEFAULT 0,
    completed_articles INT DEFAULT 0,
    total_study_time INT DEFAULT 0 COMMENT '总学习时长（分钟）',
    average_score DECIMAL(5,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stat_date (stat_date),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 创建部门统计表
CREATE TABLE IF NOT EXISTS department_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department VARCHAR(100) NOT NULL,
    user_count INT DEFAULT 0,
    active_user_count INT DEFAULT 0,
    avg_study_time DECIMAL(10,2) DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_department (department),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 创建工种统计表
CREATE TABLE IF NOT EXISTS job_type_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_type VARCHAR(100) NOT NULL,
    user_count INT DEFAULT 0,
    active_user_count INT DEFAULT 0,
    avg_study_time DECIMAL(10,2) DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_job_type (job_type),
    INDEX idx_job_type (job_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 创建实时统计视图 - 用户学习概览
CREATE OR REPLACE VIEW v_user_learning_overview AS
SELECT 
    u.id AS user_id,
    u.username,
    u.name,
    u.department,
    u.job_type,
    COUNT(DISTINCT lr.article_id) AS completed_articles,
    COALESCE(SUM(lr.study_time), 0) AS total_study_time,
    COALESCE(AVG(lr.score), 0) AS average_score,
    MAX(lr.completed_at) AS last_study_date,
    COUNT(DISTINCT DATE(lr.created_at)) AS study_days
FROM users u
LEFT JOIN learning_records lr ON u.id = lr.user_id AND lr.completed = 1
WHERE u.role = 'user'
GROUP BY u.id;

-- 7. 创建实时统计视图 - 最近活动
CREATE OR REPLACE VIEW v_recent_activities AS
SELECT 
    ua.id,
    u.name AS user_name,
    u.department,
    ua.activity_type,
    a.title AS article_title,
    ua.details,
    ua.created_at
FROM user_activities ua
JOIN users u ON ua.user_id = u.id
LEFT JOIN articles a ON ua.article_id = a.id
ORDER BY ua.created_at DESC
LIMIT 100;

-- 8. 创建实时统计视图 - 学习排行榜
CREATE OR REPLACE VIEW v_learning_leaderboard AS
SELECT 
    u.id AS user_id,
    u.name,
    u.department,
    u.job_type,
    COUNT(DISTINCT lr.article_id) AS completed_count,
    COALESCE(SUM(lr.study_time) / 60, 0) AS study_hours,
    COALESCE(AVG(lr.score), 0) AS avg_score,
    COUNT(DISTINCT DATE(lr.created_at)) AS active_days
FROM users u
LEFT JOIN learning_records lr ON u.id = lr.user_id AND lr.completed = 1
WHERE u.role = 'user'
GROUP BY u.id
ORDER BY completed_count DESC, study_hours DESC, avg_score DESC
LIMIT 20;

-- 9. 创建存储过程 - 更新每日统计
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_update_daily_statistics(IN p_date DATE)
BEGIN
    DECLARE v_total_users INT;
    DECLARE v_active_users INT;
    DECLARE v_new_users INT;
    DECLARE v_total_articles INT;
    DECLARE v_completed_articles INT;
    DECLARE v_total_study_time INT;
    DECLARE v_average_score DECIMAL(5,2);
    
    -- 计算总用户数
    SELECT COUNT(*) INTO v_total_users
    FROM users
    WHERE role = 'user' AND created_at <= p_date;
    
    -- 计算活跃用户数（当天有学习记录）
    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM learning_records
    WHERE DATE(created_at) = p_date;
    
    -- 计算新用户数
    SELECT COUNT(*) INTO v_new_users
    FROM users
    WHERE role = 'user' AND DATE(created_at) = p_date;
    
    -- 计算文章总数
    SELECT COUNT(*) INTO v_total_articles
    FROM articles
    WHERE created_at <= p_date;
    
    -- 计算完成的文章数
    SELECT COUNT(*) INTO v_completed_articles
    FROM learning_records
    WHERE completed = 1 AND DATE(completed_at) = p_date;
    
    -- 计算总学习时长
    SELECT COALESCE(SUM(study_time), 0) INTO v_total_study_time
    FROM learning_records
    WHERE DATE(created_at) = p_date;
    
    -- 计算平均成绩
    SELECT COALESCE(AVG(score), 0) INTO v_average_score
    FROM learning_records
    WHERE completed = 1 AND DATE(completed_at) = p_date;
    
    -- 插入或更新统计数据
    INSERT INTO daily_statistics (
        stat_date, total_users, active_users, new_users,
        total_articles, completed_articles, total_study_time, average_score
    ) VALUES (
        p_date, v_total_users, v_active_users, v_new_users,
        v_total_articles, v_completed_articles, v_total_study_time, v_average_score
    )
    ON DUPLICATE KEY UPDATE
        total_users = v_total_users,
        active_users = v_active_users,
        new_users = v_new_users,
        total_articles = v_total_articles,
        completed_articles = v_completed_articles,
        total_study_time = v_total_study_time,
        average_score = v_average_score;
END$$
DELIMITER ;

-- 10. 创建存储过程 - 更新部门统计
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_update_department_statistics()
BEGIN
    TRUNCATE TABLE department_statistics;
    
    INSERT INTO department_statistics (
        department, user_count, active_user_count, 
        avg_study_time, avg_score, completion_rate
    )
    SELECT 
        u.department,
        COUNT(DISTINCT u.id) AS user_count,
        COUNT(DISTINCT CASE 
            WHEN lr.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) 
            THEN u.id 
        END) AS active_user_count,
        COALESCE(AVG(lr.study_time), 0) AS avg_study_time,
        COALESCE(AVG(CASE WHEN lr.completed = 1 THEN lr.score END), 0) AS avg_score,
        COALESCE(AVG(CASE WHEN lr.completed = 1 THEN 100 ELSE 0 END), 0) AS completion_rate
    FROM users u
    LEFT JOIN learning_records lr ON u.id = lr.user_id
    WHERE u.role = 'user' AND u.department IS NOT NULL
    GROUP BY u.department;
END$$
DELIMITER ;

-- 11. 创建存储过程 - 更新工种统计
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_update_job_type_statistics()
BEGIN
    TRUNCATE TABLE job_type_statistics;
    
    INSERT INTO job_type_statistics (
        job_type, user_count, active_user_count, 
        avg_study_time, avg_score, completion_rate
    )
    SELECT 
        u.job_type,
        COUNT(DISTINCT u.id) AS user_count,
        COUNT(DISTINCT CASE 
            WHEN lr.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) 
            THEN u.id 
        END) AS active_user_count,
        COALESCE(AVG(lr.study_time), 0) AS avg_study_time,
        COALESCE(AVG(CASE WHEN lr.completed = 1 THEN lr.score END), 0) AS avg_score,
        COALESCE(AVG(CASE WHEN lr.completed = 1 THEN 100 ELSE 0 END), 0) AS completion_rate
    FROM users u
    LEFT JOIN learning_records lr ON u.id = lr.user_id
    WHERE u.role = 'user' AND u.job_type IS NOT NULL
    GROUP BY u.job_type;
END$$
DELIMITER ;

-- 12. 创建定时任务事件（每天凌晨2点更新统计）
DELIMITER $$
CREATE EVENT IF NOT EXISTS event_update_daily_statistics
ON SCHEDULE EVERY 1 DAY
STARTS (DATE(NOW()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
    CALL sp_update_daily_statistics(DATE_SUB(CURDATE(), INTERVAL 1 DAY));
    CALL sp_update_department_statistics();
    CALL sp_update_job_type_statistics();
END$$
DELIMITER ;

-- 13. 插入一些测试数据（可选）
-- 插入测试学习记录
INSERT INTO learning_records (user_id, article_id, study_time, score, completed, completed_at)
SELECT 
    u.id,
    a.id,
    FLOOR(RAND() * 120) + 10,  -- 10-130分钟
    FLOOR(RAND() * 40) + 60,   -- 60-100分
    IF(RAND() > 0.3, 1, 0),    -- 70%完成率
    IF(RAND() > 0.3, NOW() - INTERVAL FLOOR(RAND() * 30) DAY, NULL)
FROM users u
CROSS JOIN articles a
WHERE u.role = 'user'
AND RAND() < 0.4  -- 40%的用户-文章组合有记录
LIMIT 1000;

-- 插入测试活动记录
INSERT INTO user_activities (user_id, activity_type, article_id, details, created_at)
SELECT 
    u.id,
    ELT(FLOOR(RAND() * 4) + 1, 'login', 'start_learning', 'complete_article', 'take_quiz'),
    IF(RAND() > 0.5, a.id, NULL),
    JSON_OBJECT('source', 'web', 'duration', FLOOR(RAND() * 3600)),
    NOW() - INTERVAL FLOOR(RAND() * 7) DAY
FROM users u
LEFT JOIN articles a ON RAND() < 0.5
WHERE u.role = 'user'
LIMIT 500;

-- 初始化统计数据
CALL sp_update_daily_statistics(CURDATE());
CALL sp_update_department_statistics();
CALL sp_update_job_type_statistics();

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 查看创建的表和视图
SELECT '✅ 数据库表和视图创建完成' AS status;
SHOW TABLES LIKE '%statistics%';
SHOW TABLES LIKE 'v_%';
