#!/bin/bash

# 修复PHP和Nginx配置
SERVER="47.109.142.72"

echo "======================================"
echo "修复PHP执行问题"
echo "======================================"

cat << 'NGINX_CONFIG' > nginx-php.conf
# 在server块中添加PHP处理配置
location ~ \.php$ {
    fastcgi_pass   127.0.0.1:9000;  # 或 unix:/tmp/php-cgi.sock
    fastcgi_index  index.php;
    fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
    include        fastcgi_params;
}

# 设置默认首页
index index.html index.php;
NGINX_CONFIG

echo "请在宝塔面板中："
echo "1. 进入【网站】→ 点击你的网站 → 【配置文件】"
echo "2. 检查是否有PHP配置段（location ~ \.php$）"
echo "3. 如果没有，添加上面的配置"
echo "4. 保存并重载Nginx"
echo ""
echo "或者SSH登录服务器后执行："
echo "ssh root@$SERVER"
echo ""
echo "然后运行以下命令："
cat << 'REMOTE_FIX'

# 1. 检查PHP是否安装
php -v

# 2. 检查PHP-FPM是否运行
ps aux | grep php-fpm

# 3. 安装PHP（如果未安装）
# 宝塔通常已安装，如果没有：
# yum install php php-fpm php-mysql -y

# 4. 启动PHP-FPM
systemctl start php-fpm
# 或
service php-fpm start

# 5. 检查Nginx配置
nginx -t

# 6. 重载Nginx
nginx -s reload

REMOTE_FIX
