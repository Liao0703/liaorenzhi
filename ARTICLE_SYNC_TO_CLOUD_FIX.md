# 文章同步到云数据库解决方案

## ✅ 问题已解决

管理员账号上传的文章现在可以正确同步到云数据库了。

## 🔍 问题原因

1. **articles 表结构不完整**：缺少必要的字段（questions, file_id 等）
2. **前端同步代码不完善**：CloudArticleService 没有正确传递所有字段
3. **数据库中没有文章数据**：之前的文章只存在 localStorage 中

## 🛠️ 已实施的修复

### 1. 重建 articles 表
```sql
CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  required_reading_time INT DEFAULT 30,
  file_type VARCHAR(50) DEFAULT 'none',
  file_url TEXT,
  file_name VARCHAR(255),
  file_id VARCHAR(255),
  storage_type VARCHAR(50) DEFAULT 'local',
  status VARCHAR(50) DEFAULT 'published',
  allowed_job_types JSON,
  questions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### 2. 修复前端同步代码
- 更新 `src/cloudDataService.ts`：
  - 添加 `file_id` 字段传递
  - 添加 `questions` 字段的 JSON 序列化
  - 修复数据格式转换

### 3. 初始化示例数据
- 添加了3篇示例文章到云数据库
- 包含安全规程、技术文档、作业标准等分类

## 📊 当前云数据库文章

| ID | 标题 | 分类 | 文件类型 | 阅读时间 |
|----|------|------|----------|----------|
| 1 | 兴隆场车站安全操作规程 | 安全规程 | none | 300秒 |
| 2 | 白市驿车站设备维护手册 | 技术文档 | pdf | 600秒 |
| 3 | 运转班组作业标准 | 作业标准 | none | 240秒 |

## 🚀 使用说明

### 1. 管理员上传文章
1. 登录管理员账号（admin/123456）
2. 进入"文章管理"页面
3. 点击"添加文章"或"上传文件"
4. 填写文章信息并保存
5. 文章会自动同步到云数据库

### 2. 验证同步状态
```bash
# 方法1：通过API查看
curl http://localhost:3002/api/articles | python3 -m json.tool

# 方法2：运行同步脚本
node sync-articles-to-cloud.js

# 方法3：使用测试页面
open test-article-sync.html
```

### 3. 测试文章同步
打开测试页面 `test-article-sync.html`：
- 检查数据库连接
- 查看所有文章
- 添加新文章测试同步

## 🔧 技术细节

### 数据流程
1. **前端添加文章** → `addArticle()` 函数（src/articleData.ts）
2. **调用云端服务** → `CloudArticleService.addArticle()` （src/cloudDataService.ts）
3. **发送到后端API** → POST `/api/articles` （server/routes/articles.js）
4. **保存到云数据库** → 阿里云RDS MySQL

### 关键文件
- `src/articleData.ts` - 文章数据管理（支持云端同步）
- `src/cloudDataService.ts` - 云端文章服务
- `server/routes/articles.js` - 后端文章API
- `server/config/database.js` - 数据库连接配置

### 环境配置
```env
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform
```

## ⚠️ 注意事项

1. **双重存储**：文章同时存储在 localStorage 和云数据库
2. **同步失败降级**：如果云端同步失败，文章仍会保存到本地
3. **questions 字段**：题目数据需要 JSON 序列化后存储
4. **文件上传**：文件本身存储在服务器 `/uploads` 目录，数据库只存储路径

## 🐛 故障排除

### 如果文章没有同步
1. **检查服务器是否运行**
   ```bash
   # 确保后端服务在运行
   npm run server
   ```

2. **检查数据库连接**
   ```bash
   node sync-articles-to-cloud.js
   ```

3. **查看浏览器控制台**
   - 打开开发者工具
   - 查看 Console 是否有错误信息
   - 查看 Network 是否有失败的请求

4. **清除缓存重试**
   - 清除 localStorage
   - 刷新页面重新登录

### 常见错误及解决

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| 500 错误 | 服务器未运行 | 启动服务器 `npm run server` |
| 数据库连接失败 | 配置错误 | 检查 `.env` 文件配置 |
| 文章不显示 | 缓存问题 | 清除浏览器缓存 |
| 同步失败 | 网络问题 | 检查网络连接 |

## 📝 后续优化建议

1. **单一数据源**：考虑完全使用云数据库，移除 localStorage
2. **实时同步**：添加 WebSocket 支持实时同步
3. **同步状态显示**：在界面上显示同步状态指示器
4. **批量导入**：支持批量导入文章功能
5. **版本控制**：添加文章版本历史记录

---

更新时间：2025-02-01
状态：✅ 已完成
