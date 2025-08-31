-- 创建用户表 - 兴隆场车站班前学习监督系统
-- 使用方法：在阿里云RDS控制台或宝塔数据库管理中执行此SQL

USE learning_platform;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '加密后的密码',
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `full_name` varchar(100) DEFAULT NULL COMMENT '全名',
  `role` enum('admin','user','maintenance') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `company` varchar(100) DEFAULT '兴隆场车站' COMMENT '公司',
  `department` varchar(100) DEFAULT '白市驿车站' COMMENT '部门',
  `team` varchar(50) DEFAULT NULL COMMENT '班组',
  `job_type` varchar(50) DEFAULT NULL COMMENT '工种',
  `employee_id` varchar(20) DEFAULT NULL COMMENT '员工编号',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_department` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 插入默认管理员账号（密码：123456）
INSERT IGNORE INTO `users` (`username`, `password`, `name`, `role`, `email`, `department`) VALUES
('admin', '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', '系统管理员', 'admin', 'admin@learning-platform.com', '系统管理部'),
('maintenance', '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', '维护管理员', 'maintenance', 'maintenance@learning-platform.com', '系统维护部');

-- 查看创建结果
SELECT COUNT(*) as '用户表记录数' FROM users;
SELECT id, username, name, role, department, created_at FROM users;

-- 显示表结构
DESCRIBE users;
