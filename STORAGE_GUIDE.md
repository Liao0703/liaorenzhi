# 📍 数据存储位置详细说明

## 🎯 存储方式概述

您的兴站智训通使用 **浏览器LocalStorage** 进行数据持久化存储，所有数据都保存在用户的浏览器本地。

## 📂 存储位置详解

### 1. **浏览器LocalStorage位置**

#### **Chrome浏览器**：
```
Mac系统：
~/Library/Application Support/Google/Chrome/Default/Local Storage/leveldb/

Windows系统：
C:\Users\[用户名]\AppData\Local\Google\Chrome\User Data\Default\Local Storage\leveldb\
```

#### **Firefox浏览器**：
```
Mac系统：
~/Library/Application Support/Firefox/Profiles/[profile]/storage/default/

Windows系统：
C:\Users\[用户名]\AppData\Roaming\Mozilla\Firefox\Profiles\[profile]\storage\default\
```

#### **Safari浏览器**：
```
Mac系统：
~/Library/Safari/Databases/
```

### 2. **存储的数据结构**

系统在LocalStorage中创建以下三个存储键：

```javascript
localStorage.setItem('learning_articles', JSON.stringify(articlesData));
localStorage.setItem('learning_photos', JSON.stringify(photoStorage));
localStorage.setItem('learning_settings', JSON.stringify(settingsData));
```

### 3. **具体存储内容**

#### **📄 learning_articles** - 文章数据
```json
[
  {
    "id": 1,
    "title": "铁路安全操作规程",
    "category": "安全规程",
    "publishDate": "2024-01-01",
    "content": "文章内容...",
    "requiredReadingTime": 30,
    "questions": [...]
  }
]
```

#### **📷 learning_photos** - 照片数据
```json
[
  {
    "id": "1703123456789",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "articleId": 1,
    "articleTitle": "铁路安全操作规程",
    "userId": "user1",
    "userName": "张三"
  }
]
```

#### **⚙️ learning_settings** - 系统设置
```json
{
  "cameraInterval": 30,
  "defaultReadingTime": 30,
  "maxPhotos": 1000
}
```

## 🔍 如何查看存储数据

### 方法1：浏览器开发者工具
1. 按 `F12` 打开开发者工具
2. 切换到 `Application` 或 `存储` 标签
3. 在左侧找到 `Local Storage`
4. 点击您的网站域名
5. 查看 `learning_articles`、`learning_photos`、`learning_settings` 三个键

### 方法2：系统内置查看器
1. 登录管理员账号
2. 进入"系统设置"页面
3. 查看"存储详情"部分
4. 点击"导出存储报告"获取详细报告

### 方法3：控制台命令
在浏览器控制台中执行：
```javascript
// 查看文章数据
console.log(JSON.parse(localStorage.getItem('learning_articles')));

// 查看照片数据
console.log(JSON.parse(localStorage.getItem('learning_photos')));

// 查看系统设置
console.log(JSON.parse(localStorage.getItem('learning_settings')));
```

## 💾 存储限制和注意事项

### **存储容量限制**
- **Chrome**: 通常为 5-10MB
- **Firefox**: 通常为 10MB
- **Safari**: 通常为 5-10MB

### **数据持久性**
- ✅ 数据在浏览器关闭后仍然保存
- ✅ 数据在系统重启后仍然保存
- ❌ 清除浏览器数据会删除所有存储
- ❌ 不同浏览器之间数据不共享

### **安全考虑**
- 🔒 数据仅存储在用户本地
- 🔒 不会上传到任何服务器
- 🔒 其他网站无法访问您的数据
- ⚠️ 清除浏览器缓存会删除数据

## 🛠️ 数据管理操作

### **备份数据**
1. 在管理员面板点击"备份所有数据"
2. 系统会下载一个JSON文件
3. 保存此文件作为备份

### **恢复数据**
1. 在管理员面板点击"清空所有数据"
2. 手动将备份的JSON文件内容复制到LocalStorage
3. 或使用系统提供的恢复功能

### **清理数据**
1. 在管理员面板点击"清空所有数据"
2. 或使用浏览器设置清除网站数据
3. 或在开发者工具中手动删除存储键

## 📊 存储监控

系统提供实时存储监控功能：

- **存储使用率**: 显示当前使用空间和剩余空间
- **数据统计**: 文章数量、照片数量、今日照片数
- **存储详情**: 每个存储项的详细信息
- **存储报告**: 可导出的详细存储报告

## 🔧 故障排除

### **数据丢失问题**
1. 检查是否清除了浏览器缓存
2. 检查是否使用了不同的浏览器
3. 检查是否使用了隐私模式
4. 尝试从备份文件恢复数据

### **存储空间不足**
1. 清理旧的照片数据
2. 减少照片存储数量限制
3. 定期备份并清理数据
4. 考虑使用外部存储方案

## 📝 最佳实践

1. **定期备份**: 建议每周备份一次数据
2. **监控存储**: 定期检查存储使用情况
3. **清理数据**: 定期清理不需要的照片数据
4. **测试恢复**: 定期测试数据恢复功能
5. **多浏览器**: 如果需要，可以在多个浏览器中同步数据

---

*此文档详细说明了您的兴站智训通数据存储位置和管理方法。如有疑问，请参考系统内置的帮助功能。*