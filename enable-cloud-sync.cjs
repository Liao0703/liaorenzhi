#!/usr/bin/env node

/**
 * 启用云数据库同步
 * 1. 切换到云数据库配置
 * 2. 确保窗口关闭后刷新数据
 * 3. 实现实时同步
 */

const fs = require('fs');
const path = require('path');

// 云数据库配置
const cloudConfig = `# 云数据库配置
DB_HOST=rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com
DB_PORT=3306
DB_USER=admin123
DB_PASSWORD=Liao0820
DB_NAME=learning_platform

# 服务器配置
PORT=3002
NODE_ENV=production

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-learning-platform-2025

# 应用配置
APP_NAME=兴隆场车站班前学习监督系统
APP_VERSION=2.0.0
`;

// 本地数据库配置（备份用）
const localConfig = `# 本地数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=learning_platform

# 服务器配置
PORT=3002
NODE_ENV=development

# JWT配置
JWT_SECRET=your-secret-key-here-change-in-production
`;

function switchToCloudDB() {
  console.log('🔄 切换到云数据库...');
  
  // 备份当前配置
  if (fs.existsSync('.env')) {
    fs.writeFileSync('.env.local.backup', fs.readFileSync('.env'));
    console.log('✅ 当前配置已备份到 .env.local.backup');
  }
  
  // 写入云数据库配置
  fs.writeFileSync('.env', cloudConfig);
  console.log('✅ 云数据库配置已启用');
}

function switchToLocalDB() {
  console.log('🔄 切换到本地数据库...');
  
  // 备份当前配置
  if (fs.existsSync('.env')) {
    fs.writeFileSync('.env.cloud.backup', fs.readFileSync('.env'));
    console.log('✅ 当前配置已备份到 .env.cloud.backup');
  }
  
  // 写入本地数据库配置
  fs.writeFileSync('.env', localConfig);
  console.log('✅ 本地数据库配置已启用');
}

// 修复窗口关闭后的数据刷新问题
function generateWindowRefreshCode() {
  return `
// === 窗口同步代码 ===
// 将此代码添加到 edit-user-window.html 和 add-user-window.html

// 在保存成功后添加：
function handleSaveSuccess() {
  // 通知父窗口刷新数据
  if (window.opener && !window.opener.closed) {
    try {
      // 方法1：调用父窗口的刷新函数
      if (window.opener.refreshUserList) {
        window.opener.refreshUserList();
        console.log('✅ 已通知父窗口刷新用户列表');
      }
      
      // 方法2：发送消息给父窗口
      window.opener.postMessage({ 
        type: 'USER_DATA_UPDATED',
        action: 'refresh'
      }, '*');
      
      // 方法3：触发自定义事件
      const event = new CustomEvent('userDataUpdated', { 
        detail: { needRefresh: true } 
      });
      window.opener.dispatchEvent(event);
      
    } catch (e) {
      console.error('无法通知父窗口:', e);
    }
  }
  
  // 延迟关闭窗口，确保数据已保存
  setTimeout(() => {
    window.close();
  }, 500);
}

// === 父窗口监听代码 ===
// 将此代码添加到 src/components/UserManagement.tsx

// 在组件中添加消息监听：
useEffect(() => {
  // 监听来自子窗口的消息
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'USER_DATA_UPDATED') {
      console.log('收到数据更新通知，刷新列表');
      loadUsers();
    }
  };
  
  // 监听自定义事件
  const handleUserDataUpdated = () => {
    console.log('用户数据已更新，刷新列表');
    loadUsers();
  };
  
  window.addEventListener('message', handleMessage);
  window.addEventListener('userDataUpdated', handleUserDataUpdated);
  
  // 设置全局刷新函数
  window.refreshUserList = loadUsers;
  
  return () => {
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('userDataUpdated', handleUserDataUpdated);
    delete window.refreshUserList;
  };
}, []);
`;
}

// 检查当前配置
function checkCurrentConfig() {
  console.log('\n📋 当前数据库配置：');
  
  if (!fs.existsSync('.env')) {
    console.log('❌ 未找到 .env 文件');
    return null;
  }
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const dbHost = envContent.match(/DB_HOST=(.*)/)?.[1];
  
  if (dbHost && dbHost.includes('rds.aliyuncs.com')) {
    console.log('☁️  使用云数据库:', dbHost);
    return 'cloud';
  } else if (dbHost === 'localhost' || dbHost === '127.0.0.1') {
    console.log('💻 使用本地数据库:', dbHost);
    return 'local';
  } else {
    console.log('❓ 未知数据库配置:', dbHost);
    return 'unknown';
  }
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🚀 云数据库同步配置工具\n');
  
  if (command === 'cloud') {
    switchToCloudDB();
    console.log('\n⚡ 下一步：');
    console.log('1. 重启服务器: npm run server');
    console.log('2. 清除浏览器缓存并重新登录');
  } else if (command === 'local') {
    switchToLocalDB();
    console.log('\n⚡ 下一步：');
    console.log('1. 重启服务器: npm run server');
    console.log('2. 确保本地MySQL服务正在运行');
  } else if (command === 'check') {
    const current = checkCurrentConfig();
    if (current === 'local') {
      console.log('\n💡 提示：要启用云数据库同步，运行: node enable-cloud-sync.js cloud');
    } else if (current === 'cloud') {
      console.log('\n✅ 云数据库同步已启用');
    }
  } else if (command === 'fix-refresh') {
    console.log('\n📝 窗口刷新修复代码：');
    console.log(generateWindowRefreshCode());
  } else {
    console.log('使用方法：');
    console.log('  node enable-cloud-sync.js cloud      - 切换到云数据库');
    console.log('  node enable-cloud-sync.js local      - 切换到本地数据库');
    console.log('  node enable-cloud-sync.js check      - 检查当前配置');
    console.log('  node enable-cloud-sync.js fix-refresh - 获取窗口刷新修复代码');
    console.log('');
    checkCurrentConfig();
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}

module.exports = {
  switchToCloudDB,
  switchToLocalDB,
  checkCurrentConfig,
  generateWindowRefreshCode
};
