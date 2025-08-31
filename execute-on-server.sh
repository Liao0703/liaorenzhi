#!/bin/bash
# 在服务器上执行SQL的脚本

echo "将以下命令复制到服务器上执行："
echo "================================"
cat << 'EOF'
# 1. 创建SQL文件
cat > /tmp/create-stats.sql << 'SQLEND'
-- 创建学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    article_id INT NOT NULL,
    study_time INT DEFAULT 0,
    score INT DEFAULT 0,
    completed TINYINT DEFAULT 0,
    completed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_article_id (article_id),
    INDEX idx_completed (completed),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建用户活动表
CREATE TABLE IF NOT EXISTS user_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    article_id INT NULL,
    details JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建部门统计表
CREATE TABLE IF NOT EXISTS department_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department VARCHAR(100) NOT NULL,
    user_count INT DEFAULT 0,
    active_user_count INT DEFAULT 0,
    avg_study_time DECIMAL(10,2) DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建工种统计表
CREATE TABLE IF NOT EXISTS job_type_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_type VARCHAR(100) NOT NULL,
    user_count INT DEFAULT 0,
    active_user_count INT DEFAULT 0,
    avg_study_time DECIMAL(10,2) DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_job_type (job_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQLEND

# 2. 执行SQL（请替换为实际的数据库信息）
mysql -h rm-bp1dr105yc538i75rro.mysql.rds.aliyuncs.com -P 3306 -u xiaoliao -p'Tl199817#' xiaoliao_station < /tmp/create-stats.sql

# 3. 检查表是否创建成功
mysql -h rm-bp1dr105yc538i75rro.mysql.rds.aliyuncs.com -P 3306 -u xiaoliao -p'Tl199817#' xiaoliao_station -e "SHOW TABLES LIKE '%statistics%'; SHOW TABLES LIKE '%learning_records%'; SHOW TABLES LIKE '%activities%';"

echo "✅ 数据库表创建完成"
EOF
