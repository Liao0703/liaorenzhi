// 维护模式功能演示脚本
// 在浏览器控制台中运行此脚本来测试维护模式功能

console.log('🔧 维护模式功能演示');
console.log('========================');

// 检查维护模式状态
function checkMaintenanceStatus() {
  const config = localStorage.getItem('learning_maintenance_config');
  const isEnabled = config ? JSON.parse(config).isEnabled : false;
  console.log(`当前维护模式状态: ${isEnabled ? '已启用' : '未启用'}`);
  return isEnabled;
}

// 启用维护模式
function enableMaintenance() {
  const config = {
    isEnabled: true,
    reason: '系统演示维护',
    message: '这是一个演示维护，用于展示维护模式功能。',
    enabledBy: '演示用户',
    startTime: new Date().toISOString()
  };
  localStorage.setItem('learning_maintenance_config', JSON.stringify(config));
  console.log('✅ 维护模式已启用');
  console.log('配置信息:', config);
}

// 禁用维护模式
function disableMaintenance() {
  const config = localStorage.getItem('learning_maintenance_config');
  if (config) {
    const parsedConfig = JSON.parse(config);
    parsedConfig.isEnabled = false;
    parsedConfig.endTime = new Date().toISOString();
    localStorage.setItem('learning_maintenance_config', JSON.stringify(parsedConfig));
    console.log('✅ 维护模式已禁用');
  } else {
    console.log('❌ 没有找到维护配置');
  }
}

// 清除维护配置
function clearMaintenance() {
  localStorage.removeItem('learning_maintenance_config');
  localStorage.removeItem('learning_maintenance_history');
  console.log('✅ 维护配置已清除');
}

// 查看维护信息
function showMaintenanceInfo() {
  const config = localStorage.getItem('learning_maintenance_config');
  if (config) {
    const parsedConfig = JSON.parse(config);
    console.log('📋 维护信息:');
    console.log('- 状态:', parsedConfig.isEnabled ? '已启用' : '未启用');
    console.log('- 原因:', parsedConfig.reason);
    console.log('- 信息:', parsedConfig.message);
    console.log('- 维护人员:', parsedConfig.enabledBy);
    console.log('- 开始时间:', new Date(parsedConfig.startTime).toLocaleString());
    if (parsedConfig.endTime) {
      console.log('- 结束时间:', new Date(parsedConfig.endTime).toLocaleString());
    }
  } else {
    console.log('❌ 没有找到维护配置');
  }
}

// 查看维护历史
function showMaintenanceHistory() {
  const history = localStorage.getItem('learning_maintenance_history');
  if (history) {
    const parsedHistory = JSON.parse(history);
    console.log('📚 维护历史:');
    parsedHistory.forEach((record, index) => {
      console.log(`记录 ${index + 1}:`);
      console.log(`- 状态: ${record.isEnabled ? '已启用' : '已禁用'}`);
      console.log(`- 原因: ${record.reason}`);
      console.log(`- 维护人员: ${record.enabledBy}`);
      console.log(`- 开始时间: ${new Date(record.startTime).toLocaleString()}`);
      if (record.endTime) {
        console.log(`- 结束时间: ${new Date(record.endTime).toLocaleString()}`);
      }
      console.log('---');
    });
  } else {
    console.log('❌ 没有找到维护历史');
  }
}

// 显示所有可用的函数
function showHelp() {
  console.log('🔧 可用的演示函数:');
  console.log('- checkMaintenanceStatus() - 检查维护模式状态');
  console.log('- enableMaintenance() - 启用维护模式');
  console.log('- disableMaintenance() - 禁用维护模式');
  console.log('- clearMaintenance() - 清除维护配置');
  console.log('- showMaintenanceInfo() - 查看维护信息');
  console.log('- showMaintenanceHistory() - 查看维护历史');
  console.log('- showHelp() - 显示此帮助信息');
}

// 自动检查当前状态
console.log('当前状态检查:');
checkMaintenanceStatus();

console.log('\n💡 提示: 运行 showHelp() 查看所有可用的演示函数');
console.log('💡 提示: 启用维护模式后，刷新页面可以看到维护页面效果');

// 导出函数到全局作用域
window.maintenanceDemo = {
  checkMaintenanceStatus,
  enableMaintenance,
  disableMaintenance,
  clearMaintenance,
  showMaintenanceInfo,
  showMaintenanceHistory,
  showHelp
};

console.log('✅ 演示函数已加载到 window.maintenanceDemo 对象中'); 