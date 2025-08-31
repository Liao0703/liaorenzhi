# 🔐 登录凭据信息

## 问题诊断
从数据库查询结果，系统中有以下用户：

| 用户名 | 姓名 | 角色 |
|--------|------|------|
| admin | 赵六 | admin |
| **maintenance** | 孙七 | maintenance |
| user | 张三 | user |
| lisi | 李四 | user |
| wangwu | 王五 | user |
| zhaoliu | 周八 | user |
| liaorenzhi | 廖仁志 | user |

## 登录测试凭据

请尝试以下用户名和密码组合：

### 维护用户
- **用户名**: `maintenance`
- **密码**: `123456` 或 `maintenance`

### 管理员用户  
- **用户名**: `admin`
- **密码**: `123456`

### 普通用户
- **用户名**: `user`
- **密码**: `123456`

## 如果仍然无法登录
1. 检查控制台网络请求
2. 确认API地址是否正确
3. 清除浏览器缓存: `localStorage.clear()`
