# 文章上传编码和分类问题修复方案

## 问题描述

1. **编码问题**：上传文章后显示乱码
2. **分类问题**：所有文章都被统一分类为"安全培训"
3. **标题问题**：文章标题显示不正确

## 问题原因

1. **字符编码不一致**
   - 文件名使用了latin1编码，但数据库和前端期望UTF-8
   - 数据库表可能没有正确设置字符集

2. **分类逻辑固定**
   - 原始代码中的分类逻辑过于简单
   - 没有根据文件名或内容智能识别分类

3. **文件名处理不当**
   - 没有正确处理中文文件名
   - 文件名编码转换缺失

## 解决方案

### 1. 修复数据库字符集

```sql
ALTER TABLE articles 
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### 2. 修复文件上传处理

在文件上传时正确处理编码：

```javascript
// 确保使用UTF-8编码处理文件名
const originalNameBuffer = Buffer.from(req.file.originalname, 'latin1');
const originalNameUtf8 = originalNameBuffer.toString('utf8');
```

### 3. 智能分类检测

根据文件名自动识别文章分类：

```javascript
function detectCategory(filename) {
  const name = filename.toLowerCase();
  
  if (name.includes('安全') || name.includes('防控')) {
    return '安全规程';
  }
  if (name.includes('设备') || name.includes('维护')) {
    return '设备维护';
  }
  if (name.includes('应急') || name.includes('处理')) {
    return '应急处理';
  }
  if (name.includes('信号') || name.includes('通信')) {
    return '信号系统';
  }
  if (name.includes('调度') || name.includes('行车')) {
    return '调度规范';
  }
  if (name.includes('作业') || name.includes('标准')) {
    return '作业标准';
  }
  
  return '培训资料'; // 默认分类
}
```

## 部署步骤

1. **执行修复脚本**
   ```bash
   # 修复现有数据
   node fix-article-upload-encoding.js
   
   # 部署到服务器
   ./deploy-encoding-fix.sh
   ```

2. **更新服务器代码**
   - 修改 `server/routes/files-simple.js` 文件
   - 添加UTF-8编码处理
   - 添加智能分类函数

3. **重启服务**
   ```bash
   pm2 restart learning-platform
   ```

## 验证方法

1. **检查现有文章**
   - 访问文章列表页面
   - 确认标题显示正常（无乱码）
   - 确认分类多样化（不再全是"安全培训"）

2. **测试新上传**
   - 上传包含中文名称的PDF或Word文档
   - 确认文章自动创建且标题正确
   - 确认分类根据文件名智能识别

## 文件列表

- `fix-article-upload-encoding.js` - 修复脚本
- `deploy-encoding-fix.sh` - 部署脚本
- `improved-upload-handler.js` - 改进的上传处理代码（生成文件）

## 注意事项

1. 执行修复前请备份数据库
2. 修复脚本会更新所有现有文章的分类
3. 确保服务器MySQL配置支持utf8mb4字符集
4. 部署后需要重启服务才能生效

## 后续优化建议

1. 添加更多分类识别规则
2. 支持从文件内容提取关键词进行分类
3. 允许用户手动修改文章分类
4. 添加文件上传时的分类选择功能

