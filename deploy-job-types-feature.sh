#!/bin/bash
# 工种分配功能部署脚本

echo "🚀 部署工种分配功能..."

# 检查数据库连接
echo "📊 检查数据库连接状态..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL 客户端已安装"
else
    echo "❌ MySQL 客户端未找到，请先安装 MySQL"
    exit 1
fi

# 尝试连接数据库并更新表结构
echo "🔧 更新数据库表结构..."
echo "请输入数据库密码来更新表结构："

# 执行数据库更新
if mysql -u root -p learning_platform < add-job-types-column.sql; then
    echo "✅ 数据库表结构更新成功"
else
    echo "⚠️  数据库更新失败，可能是：
    1. 密码错误
    2. 数据库 learning_platform 不存在
    3. 表字段已存在（这是正常的）
    
    请检查错误信息，如果是字段已存在的错误，可以忽略。"
fi

# 重启开发服务器
echo "🔄 准备重启服务..."
echo "请手动执行以下命令重启服务："
echo "  cd /Users/renzhiliao/Desktop/learning-platform"
echo "  npm run dev"

# 提示测试步骤
echo "
🧪 测试步骤：
1. 重启服务后，访问管理员面板
2. 创建或编辑文章时应该能看到工种分配选项
3. 尝试为不同工种分配文章
4. 用不同工种的用户登录测试文章可见性

📝 测试用户创建（可选）：
如需创建测试用户，请在管理面板的用户管理中添加，
或使用以下SQL（需要在数据库中执行）：

INSERT INTO users (username, password, name, job_type, role) VALUES
('test_station', '\$2a\$10\$xn3LI/AjqicNfH0lRQCKl.PBz2neMVhGm9lQSMYgNwCLfPY7LRdFy', '测试值班员', '车站值班员', 'user'),
('test_shunter', '\$2a\$10\$xn3LI/AjqicNfH0lRQCKl.PBz2neMVhGm9lQSMYgNwCLfPY7LRdFy', '测试调车员', '调车长', 'user');
-- 密码都是: demo123456

🎉 功能部署完成！
"





