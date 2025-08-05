const bcrypt = require('bcryptjs');

async function generateHashes() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const maintenancePassword = await bcrypt.hash('123456', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  console.log('📋 用户账号和密码：');
  console.log('👨‍💼 管理员: admin / admin123');
  console.log('🔧 维护人员: maintenance / 123456');
  console.log('👤 普通用户: user / user123');
  console.log('');
  console.log('🔐 密码哈希值：');
  console.log('admin123:', adminPassword);
  console.log('123456:', maintenancePassword);
  console.log('user123:', userPassword);
}

generateHashes(); 