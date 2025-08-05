# 🔧 维护人员管理功能安装指南

## 📋 功能概述

已为维护人员创建专门的管理后台，包含以下功能：
- **👥 用户管理**: 查看、添加、编辑用户信息
- **🛠️ 系统维护**: 启用/禁用维护模式、查看维护历史

## ✅ 已完成的实现

### 1. 创建的新文件
- `MaintenanceAdminPanel.tsx` - 维护人员专用管理面板（使用动态导入）
- `MaintenanceAdminSimple.tsx` - 简化版维护面板（完全独立，无外部依赖）
- `MaintenanceAdminTest.tsx` - 测试页面
- `MAINTENANCE_ADMIN_SETUP.md` - 本配置指南

### 2. 修改的文件
- `App.tsx` - 添加了维护人员管理路由

### 3. 新增路由
- `/maintenance-admin` - 维护人员管理后台（需要维护人员或管理员权限）
- `/maintenance-test` - 测试页面（无权限限制，用于测试）
- `/maintenance-simple` - 简化版维护面板（如果有导入错误，使用此版本）

## 🚀 使用方法

### 方法一：直接访问测试页面
1. 启动应用后，访问 `http://localhost:5173/maintenance-test`
2. 右上角有测试控制面板，可以切换用户角色
3. 测试用户管理和系统维护功能

### 方法二：通过正常登录访问
1. 使用维护人员账号登录：
   - 用户名：`maintenance`
   - 密码：`123456`
2. 访问 `http://localhost:5173/maintenance-admin`

### 方法三：如果遇到导入错误，使用简化版
1. 直接访问 `http://localhost:5173/maintenance-simple`
2. 这个版本完全独立，不依赖外部组件
3. 包含完整的用户管理和维护功能

## 🔧 需要手动完成的配置

### 在Dashboard中添加维护人员入口按钮

在 `src/Dashboard.tsx` 文件中，找到管理员按钮的位置，添加维护人员按钮：

```typescript
// 在现有的管理员按钮后面添加
{user?.role === 'maintenance' && (
  <button
    onClick={() => navigate('/maintenance-admin')}
    style={{
      padding: '10px 20px',
      background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500
    }}
  >
    🔧 维护管理
  </button>
)}
```

**具体步骤：**
1. 打开 `src/Dashboard.tsx`
2. 找到包含 `user?.role === 'admin'` 的管理员按钮代码
3. 在该按钮的 `)}` 后面添加上述维护人员按钮代码

## 📊 功能特性

### 用户管理功能
- ✅ 查看所有用户列表
- ✅ 添加新用户（支持工号自动生成）
- ✅ 编辑用户信息（姓名、部门、班组、工种等）
- ✅ 用户权限管理（普通用户、维护人员）
- ✅ 铁路行业化字段（部门、工种等）
- ✅ 权限控制（维护人员不能删除管理员）

### 系统维护功能
- ✅ 启用/禁用系统维护模式
- ✅ 设置维护原因和详细信息
- ✅ 查看维护历史记录
- ✅ 服务器状态监控
- ✅ 维护时长统计

## 🔒 权限说明

### 维护人员权限
- 可以管理普通用户
- 可以添加普通用户和维护人员
- 不能删除管理员账号
- 不能删除其他维护人员（需要更高权限）
- 可以管理系统维护模式

### 管理员权限
- 拥有所有维护人员权限
- 可以管理所有用户类型
- 可以删除维护人员账号
- 可以访问完整的管理面板

## 🧪 测试验证

### 用户管理测试
1. **添加用户测试**：
   - 点击"添加用户"按钮
   - 填写用户信息（工号会自动生成）
   - 保存并验证用户是否创建成功

2. **编辑用户测试**：
   - 点击用户列表中的"编辑"按钮
   - 修改用户信息
   - 保存并验证修改是否生效

3. **权限测试**：
   - 使用维护人员账号测试权限限制
   - 验证是否能正确限制对管理员账号的操作

### 系统维护测试
1. **启用维护模式**：
   - 点击"启用维护模式"
   - 填写维护原因和信息
   - 验证维护模式是否正确启用

2. **维护历史测试**：
   - 查看维护历史记录
   - 验证时间、维护人员、持续时长等信息

## 🐛 故障排除

### 组件导入错误
如果出现组件导入错误，有以下解决方案：

**解决方案1：使用简化版**
- 访问 `http://localhost:5173/maintenance-simple`
- 这个版本不依赖任何外部组件，完全独立

**解决方案2：检查文件路径**
1. 确认 `MaintenanceAdminPanel.tsx` 文件是否存在
2. 检查 `UserManagement.tsx` 组件路径是否正确
3. 确认 `MaintenancePanel.tsx` 组件是否可用

**解决方案3：手动修复导入**
如果仍有问题，可以修改 `MaintenanceAdminPanel.tsx` 中的导入语句：
```typescript
// 将这些导入
import UserManagement from './components/UserManagement';
import MaintenancePanel from './MaintenancePanel';

// 改为绝对路径
import UserManagement from '@/components/UserManagement';
import MaintenancePanel from '@/MaintenancePanel';
```

### 路由访问问题
如果无法访问维护管理页面：
1. 检查用户是否有正确的权限（maintenance 或 admin）
2. 确认路由是否正确添加到 `App.tsx`
3. 检查登录状态是否正常

### API调用失败
如果用户管理功能出现API错误：
1. 确认后端服务器是否正常运行
2. 检查 `src/config/api.ts` 中的API配置
3. 查看浏览器控制台的错误信息

## ✨ 下一步扩展

可以考虑添加的功能：
- 用户批量导入/导出
- 用户登录日志查看
- 系统监控告警功能
- 维护计划管理
- 用户权限更细粒度控制

---

**注意**: 此功能已完成核心开发，只需要在Dashboard中添加入口按钮即可完整使用。 