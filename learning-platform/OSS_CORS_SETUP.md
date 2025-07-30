# 阿里云OSS CORS配置指南

## 问题描述
文件上传到OSS时出现CORS错误：`XHR error (req "error"), PUT ... -1`

## 解决方案

### 1. 登录阿里云控制台
- 访问：https://oss.console.aliyun.com/
- 使用您的阿里云账号登录

### 2. 选择Bucket
- 在Bucket列表中找到：`liaorenzhi`
- 点击Bucket名称进入管理页面

### 3. 配置CORS规则
- 点击左侧菜单：**权限管理** → **跨域设置CORS**
- 点击 **创建规则** 按钮

### 4. 填写CORS规则
```
来源：*
允许Methods：GET, POST, PUT, DELETE, HEAD
允许Headers：*
暴露Headers：ETag
缓存时间：86400
```

### 5. 保存规则
- 点击 **确定** 保存CORS规则

### 6. 验证配置
- 规则生效可能需要几分钟时间
- 重新尝试文件上传功能

## 其他可能的问题

### AccessKey权限
确保您的AccessKey具有以下权限：
- `oss:PutObject` - 上传文件
- `oss:GetObject` - 下载文件
- `oss:DeleteObject` - 删除文件

### Bucket权限
确保Bucket设置为：
- **公共读** 或 **私有**（根据您的需求）

### Endpoint配置
确保Endpoint格式正确：
- 成都地域：`https://oss-cn-chengdu.aliyuncs.com`
- 不要包含Bucket名称

## 测试步骤
1. 配置CORS规则后等待5-10分钟
2. 重新访问学习平台
3. 尝试上传PDF或Word文件
4. 检查是否还有CORS错误

## 联系支持
如果问题仍然存在，请检查：
- 网络连接是否正常
- 浏览器控制台是否有其他错误信息
- OSS Bucket是否在正确的区域 