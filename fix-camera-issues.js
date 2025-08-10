// 摄像头问题快速修复脚本
// 在浏览器控制台中运行此脚本来诊断和修复摄像头问题

console.log('🔧 开始摄像头问题诊断...');

// 检查浏览器支持
function checkBrowserSupport() {
  console.log('📱 检查浏览器支持...');
  
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasEnumerateDevices = !!navigator.mediaDevices?.enumerateDevices;
  
  console.log(`✅ 媒体设备API支持: ${hasMediaDevices}`);
  console.log(`✅ 设备枚举支持: ${hasEnumerateDevices}`);
  
  if (!hasMediaDevices) {
    console.error('❌ 浏览器不支持摄像头功能');
    return false;
  }
  
  return true;
}

// 检查HTTPS环境
function checkHTTPSEnvironment() {
  console.log('🔒 检查安全环境...');
  
  const isHTTPS = location.protocol === 'https:';
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isSecure = isHTTPS || isLocalhost;
  
  console.log(`✅ HTTPS协议: ${isHTTPS}`);
  console.log(`✅ 本地环境: ${isLocalhost}`);
  console.log(`✅ 安全环境: ${isSecure}`);
  
  if (!isSecure) {
    console.warn('⚠️ 非安全环境，摄像头功能可能受限');
  }
  
  return isSecure;
}

// 检查设备
async function checkDevices() {
  console.log('📹 检查摄像头设备...');
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    console.log(`✅ 检测到 ${videoDevices.length} 个摄像头设备`);
    
    videoDevices.forEach((device, index) => {
      console.log(`📷 设备 ${index + 1}: ${device.label || `摄像头 ${device.deviceId.slice(0, 8)}`}`);
    });
    
    return videoDevices.length > 0;
  } catch (error) {
    console.error('❌ 设备枚举失败:', error);
    return false;
  }
}

// 检查权限
async function checkPermissions() {
  console.log('🔐 检查摄像头权限...');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('✅ 摄像头权限正常');
    
    // 立即停止流
    stream.getTracks().forEach(track => {
      track.stop();
      console.log(`🛑 停止轨道: ${track.kind}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ 摄像头权限检查失败:', error);
    
    if (error.name === 'NotAllowedError') {
      console.log('💡 解决方案: 请允许摄像头访问权限');
    } else if (error.name === 'NotFoundError') {
      console.log('💡 解决方案: 请检查摄像头连接');
    } else if (error.name === 'NotReadableError') {
      console.log('💡 解决方案: 请关闭其他使用摄像头的应用');
    }
    
    return false;
  }
}

// 测试摄像头功能
async function testCamera() {
  console.log('🎥 测试摄像头功能...');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
        facingMode: 'user'
      }
    });
    
    console.log('✅ 摄像头启动成功');
    
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    
    console.log('📊 摄像头设置:', {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
      deviceId: settings.deviceId
    });
    
    // 停止流
    stream.getTracks().forEach(track => track.stop());
    console.log('🛑 测试完成，已停止摄像头');
    
    return true;
  } catch (error) {
    console.error('❌ 摄像头测试失败:', error);
    return false;
  }
}

// 生成修复建议
function generateFixSuggestions(results) {
  console.log('\n🔧 修复建议:');
  
  if (!results.browserSupport) {
    console.log('1. 请使用Chrome、Firefox、Safari等现代浏览器');
  }
  
  if (!results.httpsEnvironment) {
    console.log('2. 建议使用HTTPS环境访问网站');
  }
  
  if (!results.hasDevices) {
    console.log('3. 请检查摄像头硬件连接');
    console.log('4. 确保摄像头未被其他应用占用');
    console.log('5. 尝试重新插拔摄像头');
  }
  
  if (!results.hasPermissions) {
    console.log('6. 请允许浏览器访问摄像头');
    console.log('7. 点击地址栏左侧的摄像头图标');
    console.log('8. 选择"允许"摄像头访问');
  }
  
  if (!results.cameraWorks) {
    console.log('9. 重启浏览器后重试');
    console.log('10. 检查系统摄像头驱动');
  }
  
  console.log('\n📋 快速修复步骤:');
  console.log('1. 刷新页面');
  console.log('2. 允许摄像头权限');
  console.log('3. 关闭其他使用摄像头的应用');
  console.log('4. 重启浏览器');
  console.log('5. 检查摄像头硬件');
}

// 主诊断函数
async function diagnoseCamera() {
  console.log('🚀 开始摄像头诊断...\n');
  
  const results = {
    browserSupport: checkBrowserSupport(),
    httpsEnvironment: checkHTTPSEnvironment(),
    hasDevices: await checkDevices(),
    hasPermissions: await checkPermissions(),
    cameraWorks: false
  };
  
  if (results.browserSupport && results.hasDevices && results.hasPermissions) {
    results.cameraWorks = await testCamera();
  }
  
  console.log('\n📊 诊断结果:');
  console.log(`浏览器支持: ${results.browserSupport ? '✅' : '❌'}`);
  console.log(`安全环境: ${results.httpsEnvironment ? '✅' : '⚠️'}`);
  console.log(`设备检测: ${results.hasDevices ? '✅' : '❌'}`);
  console.log(`权限状态: ${results.hasPermissions ? '✅' : '❌'}`);
  console.log(`功能测试: ${results.cameraWorks ? '✅' : '❌'}`);
  
  generateFixSuggestions(results);
  
  return results;
}

// 自动修复函数
async function autoFixCamera() {
  console.log('🔧 尝试自动修复摄像头问题...\n');
  
  // 尝试重新获取权限
  try {
    console.log('1. 尝试重新获取摄像头权限...');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('✅ 权限获取成功');
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.log('❌ 自动修复失败:', error.message);
    return false;
  }
}

// 导出函数供控制台使用
window.cameraDiagnostic = {
  diagnose: diagnoseCamera,
  autoFix: autoFixCamera,
  checkBrowserSupport,
  checkHTTPSEnvironment,
  checkDevices,
  checkPermissions,
  testCamera
};

console.log('📋 可用命令:');
console.log('- cameraDiagnostic.diagnose() - 完整诊断');
console.log('- cameraDiagnostic.autoFix() - 自动修复');
console.log('- cameraDiagnostic.testCamera() - 测试摄像头');

// 自动运行诊断
diagnoseCamera(); 