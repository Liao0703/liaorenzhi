import React, { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
  isActive: boolean;
  onPhotoTaken: (photoData: string) => void;
  interval: number; // 拍照间隔（秒）
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isActive, onPhotoTaken, interval }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  // 启动摄像头
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // 前置摄像头
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      console.error('摄像头启动失败:', err);
      setError('无法访问摄像头，请检查摄像头权限设置');
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 拍照
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // 设置画布尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制视频帧到画布
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 转换为base64数据
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    
    // 调用回调函数
    onPhotoTaken(photoData);
    
    console.log('照片已拍摄:', new Date().toLocaleString());
  };

  // 启动定时拍照
  const startPeriodicCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = window.setInterval(() => {
      takePhoto();
    }, interval * 1000);
  };

  // 监听isActive状态变化
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  // 监听摄像头启动成功
  useEffect(() => {
    if (stream && isActive) {
      // 延迟启动定时拍照，确保摄像头完全启动
      const timer = setTimeout(() => {
        startPeriodicCapture();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [stream, isActive, interval]);

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
        background: 'rgba(255, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1001
      }}>
        ⚠️ {error}
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
        background: stream ? '#00ff00' : '#ff0000',
        animation: stream ? 'pulse 2s infinite' : 'none'
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