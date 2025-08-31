-- 更新articles表结构，添加文件相关字段
ALTER TABLE articles 
ADD COLUMN file_type VARCHAR(10) DEFAULT 'none' COMMENT '文件类型: pdf, word, none',
ADD COLUMN file_url VARCHAR(500) DEFAULT NULL COMMENT '文件URL',
ADD COLUMN file_name VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
ADD COLUMN storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型: local, oss, hybrid',
ADD COLUMN required_reading_time INT DEFAULT 30 COMMENT '要求阅读时间(分钟)';

-- 添加索引以提高查询性能
ALTER TABLE articles ADD INDEX idx_file_type (file_type);
ALTER TABLE articles ADD INDEX idx_storage_type (storage_type);

-- 查看更新后的表结构
DESCRIBE articles;
