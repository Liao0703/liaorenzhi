# 数据库连接指南

## 数据库基本信息

### 阿里云RDS MySQL配置
- **主机地址**: rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
- **端口**: 3306
- **数据库名**: learning_platform
- **用户名**: admin123
- **密码**: Liao0820
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 服务器信息
- **ECS服务器IP**: 47.109.142.72
- **服务器系统**: CentOS 7.x
- **管理面板**: 宝塔面板

## 连接方式

### 1. 从服务器连接（内网）
服务器已配置内网访问权限，可以直接连接：

```bash
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 learning_platform
```

### 2. 从本地连接（Navicat/DBeaver等）

#### 方式一：直接连接（需配置白名单）
1. **添加IP白名单**
   - 登录[阿里云RDS控制台](https://rdsnext.console.aliyun.com)
   - 找到实例 rm-cn-7js4el1by00015fo
   - 进入【白名单配置】
   - 添加你的公网IP地址

2. **Navicat配置**
   - 主机: rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
   - 端口: 3306
   - 用户名: admin123
   - 密码: Liao0820
   - 数据库: learning_platform

#### 方式二：SSH隧道连接（推荐）
1. **Navicat SSH隧道配置**
   
   【常规】选项卡：
   - 主机: localhost
   - 端口: 3306
   - 用户名: admin123
   - 密码: Liao0820
   
   【SSH】选项卡：
   - 使用SSH隧道: ✓
   - SSH主机: 47.109.142.72
   - SSH端口: 22
   - 用户名: root
   - 密码: [服务器密码]

2. **命令行SSH隧道**
   ```bash
   # 创建SSH隧道
   ssh -L 3307:rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com:3306 root@47.109.142.72 -N
   
   # 连接本地端口
   mysql -h 127.0.0.1 -P 3307 -u admin123 -pLiao0820 learning_platform
   ```

### 3. 应用程序连接配置

#### Node.js配置（.env文件）
```env
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform
```

#### PHP配置
```php
$dbConfig = [
    'host' => 'rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com',
    'port' => 3306,
    'database' => 'learning_platform',
    'username' => 'admin123',
    'password' => 'Liao0820',
    'charset' => 'utf8mb4'
];
```

## 常见问题解决

### 问题1：1045 Access denied错误
**错误信息**: `1045 - Access denied for user 'admin123'@'xxx.xxx.xxx.xxx' (using password: YES)`

**解决方法**:
1. 检查IP白名单是否已添加你的IP
2. 获取当前IP：`curl ifconfig.me`
3. 在阿里云控制台添加IP到白名单
4. 等待2-3分钟生效

### 问题2：连接超时
**可能原因**:
- 网络防火墙拦截
- 安全组未开放3306端口
- IP白名单未配置

**解决方法**:
1. 使用SSH隧道方式连接
2. 检查本地防火墙设置
3. 确认RDS实例运行正常

### 问题3：字符集问题
**症状**: 中文显示乱码

**解决方法**:
```sql
-- 设置连接字符集
SET NAMES utf8mb4;

-- 查看当前字符集
SHOW VARIABLES LIKE 'character%';
```

## 安全建议

### 1. IP白名单管理
- ❌ 避免使用 0.0.0.0/0（允许所有IP）
- ✅ 只添加必要的IP地址
- ✅ 定期审查和清理白名单
- ✅ 使用IP段管理动态IP

### 2. 账号权限管理
- 为不同应用创建不同账号
- 限制账号权限到最小必要
- 定期更换密码
- 避免使用root账号

### 3. 连接安全
- 生产环境使用SSL连接
- 优先使用SSH隧道
- 避免在代码中硬编码密码
- 使用环境变量管理配置

## 诊断工具

### 快速诊断脚本
项目提供了诊断脚本帮助排查连接问题：

```bash
# 运行诊断脚本
./check-and-fix-rds-access.sh

# 测试RDS连接
./test-rds-connection.sh

# 查看RDS用户
./check-rds-users.sh
```

### 手动诊断命令

```bash
# 1. 获取公网IP
curl ifconfig.me

# 2. 测试DNS解析
nslookup rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com

# 3. 测试端口连接
telnet rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com 3306

# 4. 测试MySQL连接
mysql -h rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com \
      -u admin123 -pLiao0820 \
      -e "SELECT 'Connected!' as Result;"
```

## 相关文档
- [阿里云RDS连接Navicat解决方案](../阿里云RDS连接Navicat解决方案.md)
- [技术规格文档](./tech-specs.md)
- [部署指南](../DEPLOYMENT.md)

## 技术支持
- 阿里云工单系统
- 阿里云技术支持：95187
- RDS控制台日志查看

