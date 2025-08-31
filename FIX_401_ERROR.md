# 解决 401 Unauthorized 错误

## 问题原因
前端API客户端会自动从`localStorage`获取认证token并添加到所有API请求中，包括不需要认证的文章API。如果token过期或无效，会导致401错误。

## 解决方案

### 方案1：清除浏览器存储（推荐）
在浏览器开发者工具的Console中执行：
```javascript
localStorage.removeItem('auth_token');
localStorage.removeItem('user');
// 或直接清除所有
localStorage.clear();
```

### 方案2：使用无痕模式
打开浏览器无痕/隐私模式访问：`http://localhost:5173`

### 方案3：重新登录
1. 访问登录页面
2. 使用有效用户名密码重新登录
3. 获取新的认证token

## 验证修复
清除存储后，刷新页面，文章列表应该正常显示。

## 技术说明
- 文章API本身不需要认证
- 前端会自动为所有请求添加token（如果存在）
- 过期/无效token导致401错误
- 清除token后，请求不会包含认证信息，正常访问公开API
