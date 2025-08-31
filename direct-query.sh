#!/bin/bash

echo "======================================"
echo "直接查询用户数据"
echo "======================================"
echo ""
echo "请手动执行以下步骤："
echo ""
echo "1. SSH登录到服务器："
echo "   ssh root@47.109.142.72"
echo ""
echo "2. 登录后，执行以下命令查看用户："
echo ""
cat << 'COMMANDS'
# 查看所有用户
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 \
      -D learning_platform \
      -e "SELECT id, username, name, role, created_at FROM users ORDER BY id DESC;"

# 或者进入MySQL交互模式
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 learning_platform

# 然后执行：
# SELECT * FROM users;
# exit;
COMMANDS

echo ""
echo "======================================"
echo "或者创建一个Web查看页面："
echo "======================================"
echo ""
echo "在服务器上执行："
cat << 'WEB_PAGE'
cat > /www/wwwroot/learning-platform/users.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>用户列表</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #4CAF50; color: white; }
        .loading { text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <h1>学习平台用户列表</h1>
    <div id="content" class="loading">加载中...</div>
    
    <script>
        fetch('http://47.109.142.72:3002/api/users', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                document.getElementById('content').innerHTML = 
                    '<p>需要登录。请先访问 <a href="http://47.109.142.72">主页</a> 登录。</p>';
                return;
            }
            
            let html = '<table>';
            html += '<tr><th>ID</th><th>用户名</th><th>姓名</th><th>角色</th><th>注册时间</th></tr>';
            
            data.forEach(user => {
                html += '<tr>';
                html += '<td>' + user.id + '</td>';
                html += '<td>' + user.username + '</td>';
                html += '<td>' + user.name + '</td>';
                html += '<td>' + user.role + '</td>';
                html += '<td>' + (user.created_at || '-') + '</td>';
                html += '</tr>';
            });
            
            html += '</table>';
            document.getElementById('content').innerHTML = html;
        })
        .catch(err => {
            document.getElementById('content').innerHTML = 
                '<p>加载失败: ' + err.message + '</p>';
        });
    </script>
</body>
</html>
EOF

echo "页面创建成功！访问: http://47.109.142.72/users.html"
WEB_PAGE
