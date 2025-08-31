<?php
// 简单版本 - 测试数据库连接
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>用户列表 - 调试版本</h1>";
echo "<p>开始连接数据库...</p>";

// 数据库配置
$host = "rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com";
$user = "admin123";
$pass = "Liao0820";
$db = "learning_platform";

echo "<p>连接参数：</p>";
echo "<ul>";
echo "<li>主机: $host</li>";
echo "<li>用户: $user</li>";
echo "<li>数据库: $db</li>";
echo "</ul>";

// 尝试连接
$conn = @new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo "<p style='color:red;'>连接失败: " . $conn->connect_error . "</p>";
    
    // 尝试本地数据库
    echo "<hr><p>尝试连接本地数据库...</p>";
    $conn = @new mysqli("localhost", "root", "Liao0820", "learning_platform");
    
    if ($conn->connect_error) {
        echo "<p style='color:red;'>本地数据库也连接失败: " . $conn->connect_error . "</p>";
        exit;
    } else {
        echo "<p style='color:green;'>✓ 本地数据库连接成功</p>";
    }
} else {
    echo "<p style='color:green;'>✓ 阿里云RDS连接成功</p>";
}

// 设置字符集
$conn->set_charset("utf8mb4");

// 查询用户
$sql = "SELECT id, username, name, role, created_at FROM users ORDER BY id DESC";
echo "<p>执行SQL: $sql</p>";

$result = $conn->query($sql);

if (!$result) {
    echo "<p style='color:red;'>查询失败: " . $conn->error . "</p>";
    exit;
}

echo "<p style='color:green;'>✓ 查询成功，找到 " . $result->num_rows . " 个用户</p>";

// 显示结果
if ($result->num_rows > 0) {
    echo "<table border='1' style='margin-top:20px;'>";
    echo "<tr><th>ID</th><th>用户名</th><th>姓名</th><th>角色</th><th>注册时间</th></tr>";
    
    while($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row["id"] . "</td>";
        echo "<td>" . $row["username"] . "</td>";
        echo "<td>" . $row["name"] . "</td>";
        echo "<td>" . $row["role"] . "</td>";
        echo "<td>" . $row["created_at"] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>没有找到用户数据</p>";
}

$conn->close();
echo "<hr><p>脚本执行完成</p>";
?>
