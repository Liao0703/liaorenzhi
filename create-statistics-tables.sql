-- 创建学习记录表（如果不存在）
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_user_article (user_id, article_id),
    INDEX idx_created_at (created_at),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加用户表的必要字段（如果不存在）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login_time DATETIME NULL COMMENT '最后登录时间',
ADD COLUMN IF NOT EXISTS total_study_time INT DEFAULT 0 COMMENT '总学习时长（分钟）',
ADD COLUMN IF NOT EXISTS completed_articles INT DEFAULT 0 COMMENT '完成文章数',
ADD COLUMN IF NOT EXISTS average_score DECIMAL(5,2) DEFAULT 0 COMMENT '平均成绩';

-- 创建统计视图：用户学习概览
CREATE OR REPLACE VIEW v_user_learning_overview AS
SELECT 
    u.id,
    u.name,
    u.username,
    u.department,
    u.job_type,
    COUNT(DISTINCT lr.article_id) as completed_articles,
    COALESCE(SUM(lr.study_time), 0) as total_study_time,
    COALESCE(AVG(lr.score), 0) as average_score,
    MAX(lr.created_at) as last_study_time,
    CASE 
        WHEN MAX(lr.created_at) > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'active'
        ELSE 'inactive'
    END as status
FROM users u
LEFT JOIN learning_records lr ON u.id = lr.user_id AND lr.completed = 1
WHERE u.role = 'user'
GROUP BY u.id;

-- 创建统计视图：部门学习统计
CREATE OR REPLACE VIEW v_department_statistics AS
SELECT 
    department,
    COUNT(DISTINCT id) as user_count,
    SUM(completed_articles) as total_completed,
    AVG(average_score) as avg_score,
    SUM(total_study_time) as total_time
FROM v_user_learning_overview
GROUP BY department;

-- 创建统计视图：工种学习统计
CREATE OR REPLACE VIEW v_job_type_statistics AS
SELECT 
    job_type,
    COUNT(DISTINCT id) as user_count,
    SUM(completed_articles) as total_completed,
    AVG(average_score) as avg_score,
    SUM(total_study_time) as total_time
FROM v_user_learning_overview
WHERE job_type IS NOT NULL
GROUP BY job_type;

-- 插入示例学习记录数据（用于测试）
-- 注意：只在没有数据时插入
INSERT INTO learning_records (user_id, article_id, study_time, score, completed, completed_at)
SELECT 
    u.id,
    a.id,
    FLOOR(RAND() * 60 + 20), -- 20-80分钟
    FLOOR(RAND() * 30 + 70), -- 70-100分
    1,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
FROM users u
CROSS JOIN (SELECT id FROM articles LIMIT 5) a
WHERE u.role = 'user' 
AND NOT EXISTS (
    SELECT 1 FROM learning_records lr 
    WHERE lr.user_id = u.id AND lr.article_id = a.id
)
LIMIT 50;

-- 更新用户统计字段
UPDATE users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(DISTINCT article_id) as completed,
        SUM(study_time) as total_time,
        AVG(score) as avg_score
    FROM learning_records
    WHERE completed = 1
    GROUP BY user_id
) stats ON u.id = stats.user_id
SET 
    u.completed_articles = COALESCE(stats.completed, 0),
    u.total_study_time = COALESCE(stats.total_time, 0),
    u.average_score = COALESCE(stats.avg_score, 0)
WHERE u.role = 'user';

-- 创建存储过程：生成每日统计报告
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_daily_stats()
BEGIN
    -- 更新用户统计
    UPDATE users u
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(DISTINCT article_id) as completed,
            SUM(study_time) as total_time,
            AVG(score) as avg_score
        FROM learning_records
        WHERE completed = 1
        GROUP BY user_id
    ) stats ON u.id = stats.user_id
    SET 
        u.completed_articles = COALESCE(stats.completed, 0),
        u.total_study_time = COALESCE(stats.total_time, 0),
        u.average_score = COALESCE(stats.avg_score, 0)
    WHERE u.role = 'user';
END//
DELIMITER ;

-- 创建事件：每天凌晨2点执行统计更新
CREATE EVENT IF NOT EXISTS daily_stats_update
ON SCHEDULE EVERY 1 DAY
STARTS (DATE(NOW()) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO CALL generate_daily_stats();




