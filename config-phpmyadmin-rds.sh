#!/bin/bash

# 配置phpMyAdmin连接阿里云RDS
SERVER="47.109.142.72"

echo "======================================"
echo "配置phpMyAdmin多服务器支持"
echo "======================================"

ssh root@$SERVER << 'CONFIG_PMA'

echo "[1] 查找phpMyAdmin配置文件..."
PMA_CONFIG=$(find /www -name "config.inc.php" -path "*/phpmyadmin/*" 2>/dev/null | head -1)

if [ -z "$PMA_CONFIG" ]; then
    echo "未找到phpMyAdmin配置文件，尝试常见路径..."
    PMA_CONFIG="/www/server/phpmyadmin/config.inc.php"
fi

echo "配置文件路径: $PMA_CONFIG"

if [ -f "$PMA_CONFIG" ]; then
    echo "[2] 备份原配置..."
    cp "$PMA_CONFIG" "$PMA_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    
    echo "[3] 添加多服务器配置..."
    
    # 检查是否已有多服务器配置
    if grep -q "rm-cn-7js4el1by00015fo" "$PMA_CONFIG"; then
        echo "阿里云RDS配置已存在"
    else
        # 在文件末尾添加多服务器配置
        cat >> "$PMA_CONFIG" << 'PHP_CONFIG'

/* 多服务器配置 */
$i = 1;
/* 本地MySQL服务器 */
$cfg['Servers'][$i]['verbose'] = '本地MySQL';
$cfg['Servers'][$i]['host'] = 'localhost';
$cfg['Servers'][$i]['port'] = '3306';
$cfg['Servers'][$i]['socket'] = '';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['extension'] = 'mysqli';
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['AllowNoPassword'] = false;

$i++;
/* 阿里云RDS服务器 */
$cfg['Servers'][$i]['verbose'] = '阿里云RDS';
$cfg['Servers'][$i]['host'] = 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com';
$cfg['Servers'][$i]['port'] = '3306';
$cfg['Servers'][$i]['socket'] = '';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['extension'] = 'mysqli';
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['AllowNoPassword'] = false;
PHP_CONFIG
        
        echo "✅ 多服务器配置已添加"
    fi
    
    echo "[4] 重启Web服务..."
    nginx -s reload 2>/dev/null || service nginx reload 2>/dev/null
    
else
    echo "❌ 未找到phpMyAdmin配置文件"
fi

echo -e "\n[5] 测试阿里云RDS连接..."
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 \
      -e "USE learning_platform; SELECT COUNT(*) as total FROM users;" 2>/dev/null || \
echo "无法连接到阿里云RDS"

echo -e "\n[6] 创建快速查看页面..."
cat > /www/wwwroot/learning-platform/view-rds-users.php << 'PHP'
<?php
// 阿里云RDS连接配置
$host = 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com';
$user = 'admin123';
$pass = 'Liao0820';
$db = 'learning_platform';

try {
    $conn = new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        die("连接失败: " . $conn->connect_error);
    }
    
    echo "<h2>阿里云RDS - 用户列表</h2>";
    echo "<p>数据库服务器: $host</p>";
    
    $sql = "SELECT id, username, name, role, created_at FROM users ORDER BY id DESC";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th style='padding: 10px;'>ID</th>";
        echo "<th style='padding: 10px;'>用户名</th>";
        echo "<th style='padding: 10px;'>姓名</th>";
        echo "<th style='padding: 10px;'>角色</th>";
        echo "<th style='padding: 10px;'>注册时间</th>";
        echo "</tr>";
        
        while($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td style='padding: 10px;'>" . $row["id"] . "</td>";
            echo "<td style='padding: 10px;'>" . $row["username"] . "</td>";
            echo "<td style='padding: 10px;'>" . $row["name"] . "</td>";
            echo "<td style='padding: 10px;'>" . $row["role"] . "</td>";
            echo "<td style='padding: 10px;'>" . $row["created_at"] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        echo "<p>总用户数: " . $result->num_rows . "</p>";
    } else {
        echo "没有用户数据";
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "错误: " . $e->getMessage();
}
?>
PHP

echo "✅ 查看页面已创建: http://47.109.142.72/view-rds-users.php"

CONFIG_PMA

echo ""
echo "======================================"
echo "配置完成！"
echo "======================================"
echo ""
echo "现在你可以："
echo ""
echo "1. 直接查看阿里云RDS用户列表："
echo "   http://47.109.142.72/view-rds-users.php"
echo ""
echo "2. 在phpMyAdmin中切换服务器："
echo "   http://47.109.142.72:8888/phpmyadmin/"
echo "   登录时选择服务器："
echo "   - 本地MySQL: localhost"
echo "   - 阿里云RDS: rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com"
echo ""
echo "3. 直接登录阿里云RDS："
echo "   服务器: rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com"
echo "   用户名: admin123"
echo "   密码: Liao0820"

