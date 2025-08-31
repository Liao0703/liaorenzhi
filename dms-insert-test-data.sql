-- 第三步：插入测试数据（可选）
-- 在DMS中执行这个脚本来创建一些测试数据

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
LIMIT 100;

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
LIMIT 50;

-- 更新部门统计
INSERT INTO department_statistics (department, user_count, active_user_count, avg_study_time, avg_score, completion_rate)
SELECT 
    u.department,
    COUNT(DISTINCT u.id) AS user_count,
    COUNT(DISTINCT CASE WHEN lr.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) AS active_user_count,
    COALESCE(AVG(lr.study_time), 0) AS avg_study_time,
    COALESCE(AVG(CASE WHEN lr.completed = 1 THEN lr.score END), 0) AS avg_score,
    COALESCE(AVG(CASE WHEN lr.completed = 1 THEN 100 ELSE 0 END), 0) AS completion_rate
FROM users u
LEFT JOIN learning_records lr ON u.id = lr.user_id
WHERE u.role = 'user' AND u.department IS NOT NULL
GROUP BY u.department
ON DUPLICATE KEY UPDATE
    user_count = VALUES(user_count),
    active_user_count = VALUES(active_user_count),
    avg_study_time = VALUES(avg_study_time),
    avg_score = VALUES(avg_score),
    completion_rate = VALUES(completion_rate);

-- 更新工种统计
INSERT INTO job_type_statistics (job_type, user_count, active_user_count, avg_study_time, avg_score, completion_rate)
SELECT 
    u.job_type,
    COUNT(DISTINCT u.id) AS user_count,
    COUNT(DISTINCT CASE WHEN lr.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) AS active_user_count,
    COALESCE(AVG(lr.study_time), 0) AS avg_study_time,
    COALESCE(AVG(CASE WHEN lr.completed = 1 THEN lr.score END), 0) AS avg_score,
    COALESCE(AVG(CASE WHEN lr.completed = 1 THEN 100 ELSE 0 END), 0) AS completion_rate
FROM users u
LEFT JOIN learning_records lr ON u.id = lr.user_id
WHERE u.role = 'user' AND u.job_type IS NOT NULL
GROUP BY u.job_type
ON DUPLICATE KEY UPDATE
    user_count = VALUES(user_count),
    active_user_count = VALUES(active_user_count),
    avg_study_time = VALUES(avg_study_time),
    avg_score = VALUES(avg_score),
    completion_rate = VALUES(completion_rate);
