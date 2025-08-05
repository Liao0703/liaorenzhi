const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'admin123';
  const hash = '$2a$10$88ptS8Dk08IWOb/SG1rcheW6pOo0DcOgcH3Jadvv8suiFVFjvoFTG';
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Password test result:', isValid);
  
  // 生成新的哈希
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash:', newHash);
  
  // 验证新哈希
  const isValidNew = await bcrypt.compare(password, newHash);
  console.log('New hash test result:', isValidNew);
}

testPassword(); 