# 用户账号管理404错误修复指南

## 问题分析
用户账号管理中的"添加用户"和"编辑用户"功能显示404错误是因为：
- `add-user-window.html` 和 `edit-user-window.html` 文件没有在生产环境的 `dist` 目录中
- 前端服务器只能服务 `dist` 目录中的文件

## 修复步骤

### 方法1：通过宝塔面板上传（最简单）
1. 登录宝塔面板：http://47.109.142.72:8888
2. 进入文件管理
3. 导航到：`/root/learning-platform/dist/`
4. 上传本项目根目录下的以下两个文件：
   - `add-user-window.html`
   - `edit-user-window.html`
5. 重启前端应用：在终端中运行 `pm2 restart frontend`

### 方法2：使用SCP命令上传
```bash
# 在本地项目目录执行
scp add-user-window.html edit-user-window.html root@47.109.142.72:/root/learning-platform/dist/

# 然后重启前端服务
ssh root@47.109.142.72 "cd /root/learning-platform && pm2 restart frontend"
```

### 方法3：直接登录服务器操作
```bash
# SSH登录服务器
ssh root@47.109.142.72

# 进入项目目录
cd /root/learning-platform

# 如果有最新的代码，拉取更新
git pull

# 复制HTML文件到dist目录
cp add-user-window.html edit-user-window.html dist/

# 重启前端服务
pm2 restart frontend
```

## 验证修复
1. 打开用户账号管理页面
2. 点击"➕ 添加用户"按钮 - 应该能正常打开弹窗
3. 点击任意用户的"编辑"按钮 - 应该能正常打开编辑弹窗

## 长期解决方案
我已经更新了 `vite.config.ts`，在未来的构建过程中会自动包含这些HTML文件。

## 故障排查
如果问题仍然存在：
1. 检查文件是否存在：`ls -la /root/learning-platform/dist/*.html`
2. 检查nginx配置：`nginx -t && nginx -s reload`
3. 检查前端服务状态：`pm2 status`
4. 查看前端服务日志：`pm2 logs frontend`
