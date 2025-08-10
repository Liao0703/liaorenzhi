import React, { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
  isActive: boolean;
  onPhotoTaken: (photoData: string) => void;
  interval: number; // 拍照间隔（秒）
  enableFaceRecognition?: boolean; // 是否启用人脸识别
  onFaceRecognitionResult?: (result: any) => void; // 人脸识别结果回调
  enableRandomCapture?: boolean; // 启用随机拍摄N张
  randomCaptureCount?: number; // 随机拍摄数量
  enableAntiCheating?: boolean; // 启用防代学功能
  onAntiCheatingAlert?: () => void; // 防代学检测到问题时的回调
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  isActive, 
  onPhotoTaken, 
  interval,
  enableFaceRecognition = false,
  onFaceRecognitionResult,
  enableRandomCapture = false,
  randomCaptureCount = 3,
  enableAntiCheating = false,
  onAntiCheatingAlert
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRandomCaptureActive, setIsRandomCaptureActive] = useState(false);
  const [currentRandomCount, setCurrentRandomCount] = useState(0);
  const [learningPaused, setLearningPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  const randomCaptureTimeoutRef = useRef<number | null>(null);

  // 启动摄像头
  const startCamera = async () => {
    try {
      console.log('正在启动摄像头...');
      
      // 检查浏览器是否支持媒体设备API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能，请使用Chrome、Firefox、Safari等现代浏览器');
      }
      
      // 检查是否在HTTPS环境下
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('摄像头功能在非HTTPS环境下可能受限');
      }
      
      // 安全地获取摄像头设备列表
      let devices: MediaDeviceInfo[] = [];
      try {
        if (navigator.mediaDevices.enumerateDevices) {
          devices = await navigator.mediaDevices.enumerateDevices();
        }
      } catch (err) {
        console.warn('无法枚举设备，尝试直接获取摄像头:', err);
      }
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('可用的摄像头设备:', videoDevices.map(d => ({ id: d.deviceId, label: d.label })));
      
      if (videoDevices.length === 0) {
        throw new Error('未检测到摄像头设备，请检查摄像头连接或尝试刷新页面');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user', // 前置摄像头
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      console.log('摄像头启动成功');
      console.log('摄像头轨道信息:', mediaStream.getVideoTracks().map(track => ({
        label: track.label,
        settings: track.getSettings()
      })));
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // 等待视频加载完成
        videoRef.current.onloadedmetadata = () => {
          console.log('视频元数据加载完成');
          console.log('视频尺寸:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setIsCameraReady(true);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('视频可以播放');
          setIsCameraReady(true);
        };
        
        videoRef.current.onerror = (e) => {
          console.error('视频加载错误:', e);
          setError('视频加载失败，请检查摄像头是否被其他应用占用');
        };
      }
      
      setError('');
    } catch (err) {
      console.error('摄像头启动失败:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('摄像头权限被拒绝\n\n解决方案：\n1. 点击地址栏左侧的摄像头图标\n2. 选择"允许"摄像头访问\n3. 刷新页面重试');
        } else if (err.name === 'NotFoundError') {
          setError('未找到摄像头设备\n\n解决方案：\n1. 检查摄像头是否正确连接\n2. 确保摄像头未被其他应用占用\n3. 尝试重新插拔摄像头\n4. 刷新页面重试');
        } else if (err.name === 'NotReadableError') {
          setError('摄像头被其他应用占用\n\n解决方案：\n1. 关闭其他使用摄像头的应用\n2. 重启浏览器\n3. 检查系统摄像头设置');
        } else if (err.name === 'NotSupportedError') {
          setError('浏览器不支持摄像头功能\n\n解决方案：\n1. 使用Chrome、Firefox、Safari等现代浏览器\n2. 确保浏览器版本较新\n3. 检查浏览器设置中的摄像头权限');
        } else {
          setError(`摄像头启动失败: ${err.message}\n\n请检查：\n1. 摄像头硬件是否正常\n2. 浏览器权限设置\n3. 系统摄像头驱动`);
        }
      } else {
        setError('无法访问摄像头\n\n请检查：\n1. 摄像头硬件连接\n2. 浏览器权限设置\n3. 系统摄像头驱动\n4. 尝试刷新页面');
      }
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    console.log('正在停止摄像头...');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('摄像头轨道已停止:', track.kind);
      });
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (randomCaptureTimeoutRef.current) {
      clearTimeout(randomCaptureTimeoutRef.current);
      randomCaptureTimeoutRef.current = null;
    }
    setIsCameraReady(false);
    setIsRandomCaptureActive(false);
    setCurrentRandomCount(0);
    setLearningPaused(false);
  };

  // 简单的人脸检测（基于肤色和基本图像分析）
  const detectFace = (imageData: ImageData): boolean => {
    // 简单的肤色检测算法
    let skinPixels = 0;
    let totalPixels = imageData.data.length / 4;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // 简单的肤色检测（RGB范围）
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b && 
          r - g > 15 && 
          Math.abs(r - g) > 15) {
        skinPixels++;
      }
    }
    
    const skinRatio = skinPixels / totalPixels;
    // 如果肤色像素比例在合理范围内，认为有人脸
    return skinRatio > 0.02 && skinRatio < 0.4;
  };

  // 随机拍摄N张照片
  const performRandomCapture = async () => {
    if (!enableRandomCapture || isRandomCaptureActive) return;
    
    setIsRandomCaptureActive(true);
    setCurrentRandomCount(0);
    
    console.log(`开始随机拍摄 ${randomCaptureCount} 张照片`);
    
    for (let i = 0; i < randomCaptureCount; i++) {
      setCurrentRandomCount(i + 1);
      await new Promise(resolve => setTimeout(resolve, 500)); // 每张照片间隔500ms
      takePhoto(true); // 传递参数表示这是随机拍摄
    }
    
    setIsRandomCaptureActive(false);
    setCurrentRandomCount(0);
    
    // 安排下一次随机拍摄（在间隔时间的50%-150%范围内随机）
    const randomDelay = interval * 1000 * (0.5 + Math.random());
    randomCaptureTimeoutRef.current = window.setTimeout(performRandomCapture, randomDelay);
  };

  // 拍照
  const takePhoto = (isRandomCapture = false) => {
    if (!videoRef.current || !canvasRef.current || !stream || !isCameraReady) {
      console.log('拍照条件不满足:', {
        hasVideo: !!videoRef.current,
        hasCanvas: !!canvasRef.current,
        hasStream: !!stream,
        isCameraReady
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('无法获取画布上下文');
      return;
    }

    // 检查视频是否已加载
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('视频尺寸为0，等待加载...');
      return;
    }

    console.log('开始拍照，视频尺寸:', video.videoWidth, 'x', video.videoHeight);

    // 设置画布尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      // 绘制视频帧到画布
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 检查画布是否有内容
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // 更详细的内容检查
      let nonZeroPixels = 0;
      let totalPixels = imageData.data.length / 4;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        // const a = imageData.data[i + 3]; // 透明度，暂时不需要
        
        if (r > 10 || g > 10 || b > 10) { // 不是纯黑色
          nonZeroPixels++;
        }
      }
      
      const contentRatio = nonZeroPixels / totalPixels;
      console.log('照片内容分析:', {
        totalPixels,
        nonZeroPixels,
        contentRatio: (contentRatio * 100).toFixed(2) + '%'
      });
      
      if (contentRatio < 0.01) { // 少于1%的非黑色像素
        console.warn('画布内容几乎全黑，可能是摄像头问题');
        // 尝试使用不同的摄像头设置
        return;
      }

      // 人脸检测（如果启用防代学功能）
      let faceDetected = true;
      if (enableAntiCheating) {
        faceDetected = detectFace(imageData);
        console.log('人脸检测结果:', faceDetected ? '检测到人脸' : '未检测到人脸');
        
        if (!faceDetected) {
          setLearningPaused(true);
          console.warn('⚠️ 防代学检测：未检测到人脸，学习暂停');
          if (onAntiCheatingAlert) {
            onAntiCheatingAlert();
          }
        } else if (learningPaused) {
          setLearningPaused(false);
          console.log('✅ 检测到人脸，学习恢复');
        }
      }

      // 转换为base64数据
      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      
      console.log(`照片拍摄成功 ${isRandomCapture ? '(随机拍摄)' : '(定时拍摄)'}，大小:`, photoData.length, '字节');
      console.log('照片数据预览:', photoData.substring(0, 100) + '...');
      
      // 调用回调函数
      onPhotoTaken(photoData);
      
    } catch (error) {
      console.error('拍照失败:', error);
    }
  };

  // 启动定时拍照
  const startPeriodicCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('启动定时拍照，间隔:', interval, '秒');
    
    intervalRef.current = window.setInterval(() => {
      takePhoto();
    }, interval * 1000);

    // 如果启用随机拍摄，也启动随机拍摄
    if (enableRandomCapture) {
      // 在首次启动后的随机时间开始随机拍摄
      const initialDelay = Math.random() * interval * 1000 * 0.5; // 0-50%的间隔时间后开始
      randomCaptureTimeoutRef.current = window.setTimeout(performRandomCapture, initialDelay);
    }
  };

  // 监听isActive状态变化
  useEffect(() => {
    if (isActive) {
      console.log('摄像头组件激活');
      startCamera();
    } else {
      console.log('摄像头组件停用');
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  // 监听摄像头启动成功
  useEffect(() => {
    if (stream && isActive && isCameraReady) {
      console.log('摄像头准备就绪，延迟启动定时拍照');
      // 延迟启动定时拍照，确保摄像头完全启动
      const timer = setTimeout(() => {
        startPeriodicCapture();
      }, 3000); // 增加到3秒确保完全启动

      return () => clearTimeout(timer);
    }
  }, [stream, isActive, isCameraReady, interval, enableRandomCapture, randomCaptureCount]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(255, 0, 0, 0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1001,
        maxWidth: '350px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '10px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ⚠️ 摄像头错误
        </div>
        <div style={{ 
          whiteSpace: 'pre-line', 
          lineHeight: '1.4',
          marginBottom: '10px'
        }}>
          {error}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={startCamera}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 1001,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px'
    }}>
      <div style={{
        fontSize: '12px',
        color: 'white',
        textAlign: 'center'
      }}>
        📷 学习监控中<br />
        <span style={{ fontSize: '10px', opacity: 0.8 }}>
          每{interval}秒拍照一次
        </span>
        {!isCameraReady && (
          <div style={{ fontSize: '10px', color: '#ffaa00', marginTop: '2px' }}>
            摄像头启动中...
          </div>
        )}
        {enableRandomCapture && (
          <div style={{ fontSize: '10px', color: '#00ff88', marginTop: '2px' }}>
            🎲 随机拍摄已启用
          </div>
        )}
        {isRandomCaptureActive && (
          <div style={{ fontSize: '10px', color: '#ff8800', marginTop: '2px' }}>
            📸 随机拍摄中... ({currentRandomCount}/{randomCaptureCount})
          </div>
        )}
        {enableAntiCheating && learningPaused && (
          <div style={{ fontSize: '10px', color: '#ff4444', marginTop: '2px', fontWeight: 'bold' }}>
            ⚠️ 学习已暂停 - 未检测到人脸
          </div>
        )}
        {enableAntiCheating && !learningPaused && (
          <div style={{ fontSize: '10px', color: '#44ff44', marginTop: '2px' }}>
            🔒 防代学监控中
          </div>
        )}
      </div>
      
      {/* 隐藏的视频元素用于拍照 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '1px',
          height: '1px',
          position: 'absolute',
          top: '-9999px',
          left: '-9999px'
        }}
      />
      
      {/* 隐藏的画布元素用于拍照 */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'none'
        }}
      />
      
      {/* 状态指示器 */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: isCameraReady ? '#00ff00' : '#ffaa00',
        animation: isCameraReady ? 'pulse 2s infinite' : 'none'
      }} />
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CameraCapture; 