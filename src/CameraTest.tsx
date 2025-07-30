import React, { useState, useRef, useEffect } from 'react';

const CameraTest: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [photoData, setPhotoData] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 启动摄像头
  const startCamera = async () => {
    try {
      console.log('正在启动摄像头...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      console.log('摄像头启动成功');
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('视频元数据加载完成');
          setIsCameraReady(true);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('视频可以播放');
          setIsCameraReady(true);
        };
        
        videoRef.current.onerror = (e) => {
          console.error('视频加载错误:', e);
          setError('视频加载失败');
        };
      }
      
      setError('');
    } catch (err) {
      console.error('摄像头启动失败:', err);
      if (err instanceof Error) {
        setError(`摄像头启动失败: ${err.message}`);
      } else {
        setError('无法访问摄像头');
      }
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  };

  // 拍照测试
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream || !isCameraReady) {
      console.log('拍照条件不满足');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('视频尺寸为0');
      return;
    }

    console.log('开始拍照，视频尺寸:', video.videoWidth, 'x', video.videoHeight);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some(pixel => pixel !== 0);
      
      if (!hasContent) {
        console.warn('画布内容为空');
        return;
      }

      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoData(photoData);
      
      console.log('照片拍摄成功，大小:', photoData.length, '字节');
      
    } catch (error) {
      console.error('拍照失败:', error);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div style={{
      padding: '20px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h2>摄像头测试</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={startCamera} style={{ marginRight: '10px' }}>启动摄像头</button>
        <button onClick={stopCamera} style={{ marginRight: '10px' }}>停止摄像头</button>
        <button onClick={takePhoto}>拍照测试</button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          错误: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 视频预览 */}
        <div>
          <h3>视频预览</h3>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '320px',
              height: '240px',
              border: '1px solid #ccc',
              background: '#000'
            }}
          />
          <div>状态: {isCameraReady ? '就绪' : '加载中'}</div>
        </div>

        {/* 照片预览 */}
        {photoData && (
          <div>
            <h3>拍摄的照片</h3>
            <img
              src={photoData}
              alt="拍摄的照片"
              style={{
                width: '320px',
                height: '240px',
                border: '1px solid #ccc',
                objectFit: 'contain'
              }}
            />
            <div>大小: {photoData.length} 字节</div>
          </div>
        )}
      </div>

      {/* 隐藏的画布 */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default CameraTest; 