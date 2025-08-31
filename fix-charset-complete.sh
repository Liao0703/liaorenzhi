#!/bin/bash

echo "=== 完整修复数据库字符集问题 ==="
echo "请在服务器上执行此脚本"

# 1. 创建完整的字符集修复SQL
cat > /tmp/fix-charset-complete.sql << 'EOF'
-- 完整修复数据库字符集
USE learning_platform;

-- 1. 修改数据库默认字符集
ALTER DATABASE learning_platform 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 2. 修改所有表的默认字符集
ALTER TABLE articles 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

ALTER TABLE users 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

ALTER TABLE learning_records 
CHARACTER SET = utf8mb4 
COLLATE = utf8mb4_unicode_ci;

-- 3. 修改articles表所有文本字段
ALTER TABLE articles 
MODIFY COLUMN id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN category VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. 修改文件相关字段（如果存在）
ALTER TABLE articles 
MODIFY COLUMN file_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN file_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN file_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN storage_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. 修改users表所有文本字段
ALTER TABLE users 
MODIFY COLUMN username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN full_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN company VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN department VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN team VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN job_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. 验证修复结果
SELECT 
    TABLE_NAME,
    TABLE_COLLATION
FROM 
    information_schema.TABLES
WHERE 
    TABLE_SCHEMA = 'learning_platform';

-- 7. 显示articles表结构
SHOW CREATE TABLE articles\G

-- 8. 测试中文插入
INSERT INTO articles (id, title, content, category) 
VALUES ('charset-test-001', '测试中文标题：安全规程培训', '这是测试内容，包含中文字符。', '安全规程')
ON DUPLICATE KEY UPDATE 
title = VALUES(title),
content = VALUES(content);

-- 9. 查询测试结果
SELECT id, title, content, category 
FROM articles 
WHERE id = 'charset-test-001';

-- 10. 清理测试数据
DELETE FROM articles WHERE id = 'charset-test-001';

-- 11. 输出完成信息
SELECT '字符集修复完成！' AS status;
EOF

# 2. 修改MySQL配置文件（如果需要）
echo "=== 建议修改MySQL配置文件 ==="
echo "请在宝塔面板中添加以下配置到 my.cnf："
echo "[client]"
echo "default-character-set = utf8mb4"
echo ""
echo "[mysql]"
echo "default-character-set = utf8mb4"
echo ""
echo "[mysqld]"
echo "character-set-server = utf8mb4"
echo "collation-server = utf8mb4_unicode_ci"
echo "init_connect = 'SET NAMES utf8mb4'"
echo ""

# 3. 执行SQL修复
echo "=== 执行SQL修复 ==="
echo "请在宝塔phpMyAdmin中执行 /tmp/fix-charset-complete.sql"
echo "或使用命令："
echo "mysql -u root -p learning_platform < /tmp/fix-charset-complete.sql"

# 4. 更新Node.js数据库配置
echo "=== 更新Node.js数据库配置 ==="
cat > /tmp/update-database-config.js << 'EOF'
// 在database.js中确保有以下配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'learning_platform',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  // 添加以下配置
  multipleStatements: true,
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  typeCast: function (field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      return (field.string() === '1'); // 1 = true, 0 = false
    }
    return next();
  }
};
EOF

echo "=== 完成！==="
echo "执行步骤："
echo "1. 在phpMyAdmin中执行 /tmp/fix-charset-complete.sql"
echo "2. 重启MySQL服务"
echo "3. 重启Node.js应用"
echo "4. 测试文件上传功能"




