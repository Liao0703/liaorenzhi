-- 第二步：创建视图
-- 在DMS中执行这个脚本

-- 1. 创建用户学习概览视图
CREATE OR REPLACE VIEW `v_user_learning_overview` AS
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

-- 2. 创建最近活动视图
CREATE OR REPLACE VIEW `v_recent_activities` AS
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

-- 3. 创建学习排行榜视图
CREATE OR REPLACE VIEW `v_learning_leaderboard` AS
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
