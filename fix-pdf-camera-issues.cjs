// 修复PDF文件预览和摄像头问题的脚本
const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复PDF文件预览和摄像头问题...\n');

// 1. 检查并修复摄像头权限问题
function fixCameraIssues() {
  console.log('📷 修复摄像头权限问题...');
  
  const cameraCapturePath = path.join(__dirname, 'src', 'CameraCapture.tsx');
  
  if (fs.existsSync(cameraCapturePath)) {
    let content = fs.readFileSync(cameraCapturePath, 'utf8');
    
    // 添加更安全的摄像头启动逻辑
    const safeCameraStart = `
  // 启动摄像头
  const startCamera = async () => {
    try {
      console.log('📷 正在启动摄像头...');
      setError('');
      
      // 检查浏览器是否支持媒体设备API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }
      
      // 首先尝试获取可用的摄像头设备
      let devices = [];
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (err) {
        console.warn('无法枚举设备，尝试直接获取摄像头:', err);
      }
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('📹 可用的摄像头设备:', videoDevices.map(d => ({ id: d.deviceId, label: d.label })));
      
      // 尝试不同的摄像头配置
      const cameraConfigs = [
        {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'user',
          frameRate: { ideal: 15 }
        },
        {
          width: { ideal: 320, min: 160 },
          height: { ideal: 240, min: 120 },
          facingMode: 'user',
          frameRate: { ideal: 10 }
        },
        {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      ];

      let mediaStream: MediaStream | null = null;
      
      for (const config of cameraConfigs) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: config,
            audio: false
          });
          console.log('✅ 摄像头启动成功，使用配置:', config);
          break;
        } catch (err) {
          console.warn('摄像头配置失败:', config, err);
          continue;
        }
      }

      if (!mediaStream) {
        throw new Error('无法启动摄像头，请检查权限设置');
      }
      
      console.log('📹 摄像头轨道信息:', mediaStream.getVideoTracks().map(track => ({
        label: track.label,
        settings: track.getSettings()
      })));
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // 等待视频加载完成
        videoRef.current.onloadedmetadata = () => {
          console.log('📺 视频元数据加载完成');
          console.log('📐 视频尺寸:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setIsCameraReady(true);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('▶️ 视频可以播放');
          setIsCameraReady(true);
        };
        
        videoRef.current.onerror = (e) => {
          console.error('❌ 视频加载错误:', e);
          setError('视频加载失败，请刷新页面重试');
        };
      }
      
      setRetryCount(0);
    } catch (err) {
      console.error('❌ 摄像头启动失败:', err);
      setRetryCount(prev => prev + 1);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('📷 摄像头权限被拒绝\\n请在浏览器设置中允许摄像头访问，然后刷新页面');
        } else if (err.name === 'NotFoundError') {
          setError('📷 未找到摄像头设备\\n请确保设备有摄像头并已正确连接');
        } else if (err.name === 'NotReadableError') {
          setError('📷 摄像头被其他应用占用\\n请关闭其他使用摄像头的应用后重试');
        } else if (err.name === 'OverconstrainedError') {
          setError('📷 摄像头配置不兼容\\n请尝试使用不同的浏览器或设备');
        } else {
          setError(\`📷 摄像头启动失败: \${err.message}\\n请检查摄像头设置\`);
        }
      } else {
        setError('📷 摄像头启动失败，请检查设备设置');
      }
    }
  };`;
    
    // 替换现有的startCamera函数
    const startCameraRegex = /\/\/ 启动摄像头[\s\S]*?};/;
    if (startCameraRegex.test(content)) {
      content = content.replace(startCameraRegex, safeCameraStart);
      fs.writeFileSync(cameraCapturePath, content, 'utf8');
      console.log('✅ 摄像头启动逻辑已修复');
    } else {
      console.log('⚠️ 未找到startCamera函数，跳过修复');
    }
  } else {
    console.log('❌ CameraCapture.tsx文件不存在');
  }
}

// 2. 修复PDF文件预览问题
function fixPDFPreviewIssues() {
  console.log('📄 修复PDF文件预览问题...');
  
  const articleReaderPath = path.join(__dirname, 'src', 'ArticleReader.tsx');
  
  if (fs.existsSync(articleReaderPath)) {
    let content = fs.readFileSync(articleReaderPath, 'utf8');
    
    // 添加更安全的文件预览逻辑
    const safeFilePreview = `
                        if (!fileUrl) {
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              padding: '20px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>📄</div>
                              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>文件未找到</h3>
                              <p style={{ marginBottom: '20px', opacity: 0.8, fontSize: '14px' }}>
                                文件可能已被移动、修改或删除
                              </p>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button
                                  onClick={() => {
                                    if (fileUrl) {
                                      window.open(fileUrl, '_blank');
                                    } else {
                                      alert('文件URL无效，请联系管理员');
                                    }
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'rgba(64, 158, 255, 0.8)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  在新窗口打开
                                </button>
                                <button
                                  onClick={() => {
                                    if (fileUrl) {
                                      const a = document.createElement('a');
                                      a.href = fileUrl;
                                      a.download = article.fileName || 'download';
                                      a.click();
                                    } else {
                                      alert('文件URL无效，请联系管理员');
                                    }
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'rgba(67, 194, 58, 0.8)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  下载文件
                                </button>
                                <button
                                  onClick={() => window.location.reload()}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'rgba(230, 162, 60, 0.8)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  重试
                                </button>
                              </div>
                            </div>
                          );
                        }
                        
                        // 检查文件URL是否有效
                        let previewUrl = '';
                        try {
                          previewUrl = getFilePreviewUrl(fileUrl, article.fileType || 'pdf');
                          if (!previewUrl) {
                            throw new Error('无法生成预览URL');
                          }
                        } catch (error) {
                          console.error('生成预览URL失败:', error);
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              padding: '20px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>⚠️</div>
                              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>文件预览失败</h3>
                              <p style={{ marginBottom: '20px', opacity: 0.8, fontSize: '14px' }}>
                                无法加载文件预览，请尝试下载文件
                              </p>
                              <button
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = fileUrl;
                                  a.download = article.fileName || 'download';
                                  a.click();
                                }}
                                style={{
                                  padding: '8px 16px',
                                  background: 'rgba(67, 194, 58, 0.8)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                下载文件
                              </button>
                            </div>
                          );
                        }
                        
                        return (
                          <>
                            <iframe
                              src={previewUrl}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                              }}
                              title={article.title}
                              onError={() => {
                                console.error('文件预览加载失败:', previewUrl);
                              }}
                              onLoad={() => {
                                console.log('文件预览加载成功:', previewUrl);
                              }}
                            />
                            {/* 备用操作按钮 */}
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              display: 'flex',
                              gap: '5px'
                            }}>
                              <button
                                onClick={() => window.open(fileUrl || '', '_blank')}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  backdropFilter: 'blur(10px)'
                                }}
                                title="在新窗口打开"
                              >
                                🔗
                              </button>
                              <button
                                onClick={() => {
                                  if (fileUrl) {
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = article.fileName || 'download';
                                    a.click();
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  backdropFilter: 'blur(10px)'
                                }}
                                title="下载文件"
                              >
                                ⬇️
                              </button>
                            </div>
                          </>
                        );`;
    
    // 查找并替换文件预览部分
    const filePreviewRegex = /if \(!fileUrl\) \{[\s\S]*?return \([\s\S]*?\);[\s\S]*?\}[\s\S]*?const previewUrl = getFilePreviewUrl\(fileUrl, article\.fileType \|\| 'pdf'\);[\s\S]*?return \([\s\S]*?\);[\s\S]*?\}\)\(\)/;
    
    if (filePreviewRegex.test(content)) {
      content = content.replace(filePreviewRegex, safeFilePreview);
      fs.writeFileSync(articleReaderPath, content, 'utf8');
      console.log('✅ PDF文件预览逻辑已修复');
    } else {
      console.log('⚠️ 未找到文件预览代码，跳过修复');
    }
  } else {
    console.log('❌ ArticleReader.tsx文件不存在');
  }
}

// 3. 修复文件上传服务
function fixFileUploadService() {
  console.log('📤 修复文件上传服务...');
  
  const fileUploadServicePath = path.join(__dirname, 'src', 'fileUploadService.ts');
  
  if (fs.existsSync(fileUploadServicePath)) {
    let content = fs.readFileSync(fileUploadServicePath, 'utf8');
    
    // 添加更安全的文件预览URL生成逻辑
    const safeGetFilePreviewUrl = `
// 获取文件预览URL
export const getFilePreviewUrl = (fileUrl: string, fileType: string): string => {
  try {
    if (!fileUrl) {
      console.error('文件URL为空');
      return '';
    }

    // 检查URL是否有效
    let isValidUrl = false;
    try {
      new URL(fileUrl);
      isValidUrl = true;
    } catch (error) {
      // 如果是data URL，也是有效的
      if (fileUrl.startsWith('data:')) {
        isValidUrl = true;
      } else {
        console.error('无效的文件URL:', fileUrl);
        return '';
      }
    }

    if (fileType === 'pdf') {
      // PDF直接使用原URL
      return fileUrl;
    } else if (fileType === 'word') {
      // Word使用Office Online Viewer
      if (isValidUrl && !fileUrl.startsWith('data:')) {
        return \`https://view.officeapps.live.com/op/embed.aspx?src=\${encodeURIComponent(fileUrl)}\`;
      } else {
        // 如果是data URL，直接返回
        return fileUrl;
      }
    } else if (fileType === 'text') {
      // 文本文件直接返回URL
      return fileUrl;
    } else {
      // 其他类型返回原URL
      return fileUrl;
    }
  } catch (error) {
    console.error('生成文件预览URL失败:', error);
    return fileUrl || '';
  }
};`;
    
    // 替换现有的getFilePreviewUrl函数
    const getFilePreviewUrlRegex = /\/\/ 获取文件预览URL[\s\S]*?export const getFilePreviewUrl[\s\S]*?};/;
    if (getFilePreviewUrlRegex.test(content)) {
      content = content.replace(getFilePreviewUrlRegex, safeGetFilePreviewUrl);
      fs.writeFileSync(fileUploadServicePath, content, 'utf8');
      console.log('✅ 文件预览URL生成逻辑已修复');
    } else {
      console.log('⚠️ 未找到getFilePreviewUrl函数，跳过修复');
    }
  } else {
    console.log('❌ fileUploadService.ts文件不存在');
  }
}

// 4. 创建错误处理组件
function createErrorHandler() {
  console.log('🛠️ 创建错误处理组件...');
  
  const errorHandlerPath = path.join(__dirname, 'src', 'components', 'ErrorHandler.tsx');
  
  const errorHandlerContent = `import React from 'react';

interface ErrorHandlerProps {
  error: string;
  onRetry?: () => void;
  onClose?: () => void;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({ error, onRetry, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      right: '10px',
      background: 'rgba(255, 71, 87, 0.9)',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>⚠️ 系统错误</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>{error}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              重试
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorHandler;`;
  
  // 确保components目录存在
  const componentsDir = path.dirname(errorHandlerPath);
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  fs.writeFileSync(errorHandlerPath, errorHandlerContent, 'utf8');
  console.log('✅ 错误处理组件已创建');
}

// 执行修复
try {
  fixCameraIssues();
  fixPDFPreviewIssues();
  fixFileUploadService();
  createErrorHandler();
  
  console.log('\n🎉 所有修复完成！');
  console.log('\n📋 修复内容总结：');
  console.log('1. ✅ 摄像头权限和启动逻辑优化');
  console.log('2. ✅ PDF文件预览错误处理增强');
  console.log('3. ✅ 文件URL验证和错误处理');
  console.log('4. ✅ 通用错误处理组件');
  
  console.log('\n🚀 建议操作：');
  console.log('1. 重新构建项目: npm run build');
  console.log('2. 同步到服务器: ./quick-sync.sh');
  console.log('3. 清除浏览器缓存后重新测试');
  
} catch (error) {
  console.error('❌ 修复过程中出现错误:', error);
} 