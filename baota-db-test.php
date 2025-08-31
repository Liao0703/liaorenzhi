<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>宝塔数据库连接测试</h1>";

try {
    // 使用您的阿里云数据库配置
    $host = 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com';
    $port = '3306';
    $database = 'learning_platform';
    $username = 'admin123';
    $password = 'Liao0820';
    
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    
    echo "<p>正在连接到: {$host}:{$port}/{$database}</p>";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 30
    ]);
    
    echo "<p style='color: green;'>✅ 数据库连接成功!</p>";
    
    // 测试查询用户表
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    
    echo "<p style='color: green;'>✅ 用户表查询成功，用户数量: " . $result['count'] . "</p>";
    
    // 显示用户列表
    $stmt = $pdo->query("SELECT id, username, name, role FROM users LIMIT 10");
    $users = $stmt->fetchAll();
    
    echo "<h3>用户列表：</h3>";
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>用户名</th><th>姓名</th><th>角色</th></tr>";
    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($user['id']) . "</td>";
        echo "<td>" . htmlspecialchars($user['username']) . "</td>";
        echo "<td>" . htmlspecialchars($user['name']) . "</td>";
        echo "<td>" . htmlspecialchars($user['role']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ 数据库连接失败: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p style='color: red;'>错误代码: " . $e->getCode() . "</p>";
}

echo "<br><h3>PHP环境信息</h3>";
echo "<p>PHP版本: " . PHP_VERSION . "</p>";
echo "<p>PDO MySQL支持: " . (extension_loaded('pdo_mysql') ? '✅ 已安装' : '❌ 未安装') . "</p>";
echo "<p>当前时间: " . date('Y-m-d H:i:s') . "</p>";
?>
