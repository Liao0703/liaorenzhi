# 阿里云OSS接入指南

## 📋 前置准备

### 1. 获取AccessKey
1. 登录阿里云控制台
2. 点击右上角头像 → "AccessKey 管理"
3. 创建AccessKey（建议创建子用户AccessKey）
4. 记录AccessKey ID和AccessKey Secret

### 2. 配置Bucket权限
1. 进入OSS控制台 → Bucket列表
2. 点击您的Bucket名称（liaorenzhi）
3. 进入"权限管理" → "Bucket授权策略"
4. 添加以下权限策略：

```json
{
    "Version": "1",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": [
                "oss:GetObject"
            ],
            "Resource": [
                "acs:oss:*:*:liaorenzhi/*"
            ],
            "Condition": {
                "StringEquals": {
                    "oss:Referer": "*"
                }
            }
        }
    ]
}
```

### 3. 配置CORS（跨域访问）
1. 在Bucket管理页面 → "权限管理" → "跨域设置"
2. 添加CORS规则：

```
来源: *
允许Methods: GET, POST, PUT, DELETE, HEAD
允许Headers: *
暴露Headers: ETag
缓存时间: 86400
```

## 🔧 系统配置

### 1. 在管理后台配置OSS
1. 登录系统 → 进入管理后台
2. 点击"OSS配置"标签
3. 填写以下信息：

```
地域: oss-cn-chengdu
AccessKey ID: [您的AccessKey ID]
AccessKey Secret: [您的AccessKey Secret]
Bucket名称: liaorenzhi
Endpoint: https://oss-cn-chengdu.aliyuncs.com
```

### 2. 测试连接
1. 点击"测试连接"按钮
2. 如果显示"连接成功"，说明配置正确
3. 点击"保存配置"

## 📁 文件上传配置

### 1. 上传文件类型支持
- PDF文件 (.pdf)
- Word文档 (.doc, .docx)
- 图片文件 (.jpg, .png, .gif)
- 文本文件 (.txt)

### 2. 文件存储路径
文件将按以下结构存储：
```
liaorenzhi/
├── articles/          # 文章文件
│   ├── article_1.pdf
│   └── article_2.docx
├── images/           # 图片文件
│   └── uploads/
└── sync/            # 同步数据
    └── articles_sync.json
```

## 🔒 安全配置

### 1. 防盗链设置（可选）
1. 在Bucket管理页面 → "权限管理" → "防盗链"
2. 添加Referer白名单：
   - `*.yourdomain.com`
   - `localhost:*`
   - `127.0.0.1:*`

### 2. 访问控制
1. 设置Bucket为私有读写
2. 通过签名URL访问文件
3. 定期轮换AccessKey

## 🚀 使用步骤

### 1. 管理员上传文件
1. 进入管理后台 → "文章管理"
2. 点击"添加文章"
3. 填写文章信息
4. 上传文件（支持拖拽）
5. 文件自动上传到OSS
6. 保存文章

### 2. 职工查看文件
1. 职工登录系统
2. 进入文章列表
3. 点击文章开始阅读
4. 文件从OSS加载显示

## 🔍 故障排除

### 1. 常见错误及解决方案

**错误：Access Denied**
- 检查AccessKey权限
- 确认Bucket名称正确
- 验证CORS配置

**错误：跨域请求被阻止**
- 检查CORS配置
- 确认来源域名在白名单中

**错误：文件上传失败**
- 检查网络连接
- 确认文件大小不超过限制
- 验证文件类型是否支持

### 2. 调试方法
1. 打开浏览器开发者工具
2. 查看Network标签页
3. 检查OSS请求的响应状态
4. 查看Console中的错误信息

## 📊 监控和维护

### 1. 存储使用情况
- 定期检查Bucket使用量
- 监控存储费用
- 清理无用文件

### 2. 性能优化
- 启用CDN加速
- 配置图片压缩
- 使用合适的存储类型

## 📞 技术支持

如果遇到问题，请：
1. 检查本指南的故障排除部分
2. 查看浏览器控制台错误信息
3. 联系系统管理员

---

**注意：请妥善保管您的AccessKey信息，不要泄露给他人。** 