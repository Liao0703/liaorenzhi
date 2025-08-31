<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>查看注册用户</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #333; 
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .info { 
            background: #e8f5e9; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #f44336;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 20px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #4CAF50; 
            color: white;
            font-weight: 600;
        }
        tr:hover { 
            background-color: #f5f5f5; 
        }
        tr:nth-child(even) { 
            background-color: #fafafa; 
        }
        .stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat-box {
            flex: 1;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
        }
        .stat-label {
            margin-top: 5px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 学习平台 - 用户管理中心</h1>
        
        <div class="info">
            <strong>📊 数据来源：</strong>阿里云RDS数据库<br>
            <strong>🖥️ 服务器：</strong>rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com<br>
            <strong>📅 查询时间：</strong><?php echo date('Y-m-d H:i:s'); ?>
        </div>

<?php
// 数据库配置
$host = "rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com";
$user = "admin123";
$pass = "Liao0820";
$db = "learning_platform";

// 连接数据库
$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    echo '<div class="error">❌ 数据库连接失败: ' . $conn->connect_error . '</div>';
    echo '<p>请检查：</p>';
    echo '<ul>';
    echo '<li>阿里云RDS是否正常运行</li>';
    echo '<li>安全组是否允许访问</li>';
    echo '<li>账号密码是否正确</li>';
    echo '</ul>';
    die();
}

// 查询用户总数
$sql = "SELECT id, username, name, role, email, phone, department, created_at FROM users ORDER BY id DESC";
$result = $conn->query($sql);

// 统计数据
$total_users = $result->num_rows;
$admin_count = 0;
$user_count = 0;
$maintenance_count = 0;

// 临时存储结果
$users = [];
while($row = $result->fetch_assoc()) {
    $users[] = $row;
    switch($row['role']) {
        case 'admin': $admin_count++; break;
        case 'user': $user_count++; break;
        case 'maintenance': $maintenance_count++; break;
    }
}
?>

        <div class="stats">
            <div class="stat-box" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="stat-number"><?php echo $total_users; ?></div>
                <div class="stat-label">总用户数</div>
            </div>
            <div class="stat-box" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div class="stat-number"><?php echo $admin_count; ?></div>
                <div class="stat-label">管理员</div>
            </div>
            <div class="stat-box" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <div class="stat-number"><?php echo $user_count; ?></div>
                <div class="stat-label">普通用户</div>
            </div>
            <div class="stat-box" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <div class="stat-number"><?php echo $maintenance_count; ?></div>
                <div class="stat-label">维护用户</div>
            </div>
        </div>

        <h2>📋 用户列表</h2>
        
        <?php if ($total_users > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>用户名</th>
                        <th>姓名</th>
                        <th>角色</th>
                        <th>邮箱</th>
                        <th>电话</th>
                        <th>部门</th>
                        <th>注册时间</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($users as $row): ?>
                    <tr>
                        <td><?php echo $row["id"]; ?></td>
                        <td><strong><?php echo htmlspecialchars($row["username"]); ?></strong></td>
                        <td><?php echo htmlspecialchars($row["name"]); ?></td>
                        <td>
                            <?php 
                            $role_badge = [
                                'admin' => '🔑 管理员',
                                'user' => '👤 用户',
                                'maintenance' => '🔧 维护'
                            ];
                            echo $role_badge[$row["role"]] ?? $row["role"];
                            ?>
                        </td>
                        <td><?php echo $row["email"] ?: "-"; ?></td>
                        <td><?php echo $row["phone"] ?: "-"; ?></td>
                        <td><?php echo $row["department"] ?: "-"; ?></td>
                        <td><?php echo $row["created_at"]; ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p>没有用户数据</p>
        <?php endif; ?>

        <?php $conn->close(); ?>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p>学习平台用户管理系统 v1.0</p>
        </div>
    </div>
</body>
</html>
