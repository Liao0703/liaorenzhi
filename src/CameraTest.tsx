import React, { useState, useRef, useEffect } from 'react';
import faceRecognitionService from './faceRecognitionService';
import type { FaceRecognitionResult } from './faceRecognitionService';

const CameraTest: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [photoData, setPhotoData] = useState<string>('');
  const [referencePhoto, setReferencePhoto] = useState<string>('');
  const [faceRecognitionResult, setFaceRecognitionResult] = useState<FaceRecognitionResult | null>(null);
  const [isFaceRecognitionEnabled, setIsFaceRecognitionEnabled] = useState(false);
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 添加测试结果
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

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
      addTestResult('❌ 拍照条件不满足');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      addTestResult('❌ 无法获取画布上下文');
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      addTestResult('⏳ 视频尺寸为0，等待加载...');
      return;
    }

    addTestResult('📸 开始拍照...');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some(pixel => pixel !== 0);
      
      if (!hasContent) {
        addTestResult('⚠️ 画布内容为空');
        return;
      }

      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoData(photoData);
      
      addTestResult(`✅ 照片拍摄成功，大小: ${photoData.length} 字节`);
      
    } catch (error) {
      addTestResult('❌ 拍照失败');
      console.error('拍照失败:', error);
    }
  };

  // 设置参考人脸
  const setReferenceFace = async () => {
    if (!photoData) {
      addTestResult('❌ 请先拍照');
      return;
    }

    addTestResult('🔄 设置参考人脸...');
    const success = await faceRecognitionService.setReferenceFace(photoData);
    
    if (success) {
      setReferencePhoto(photoData);
      addTestResult('✅ 参考人脸设置成功');
      setIsFaceRecognitionEnabled(true);
      setFaceRecognitionStatus('参考人脸已设置');
    } else {
      addTestResult('❌ 参考人脸设置失败');
    }
  };

  // 测试人脸识别
  const testFaceRecognition = async () => {
    if (!photoData) {
      addTestResult('❌ 请先拍照');
      return;
    }

    if (!isFaceRecognitionEnabled) {
      addTestResult('❌ 请先设置参考人脸');
      return;
    }

    addTestResult('🔍 开始人脸识别测试...');
    try {
      const result = await faceRecognitionService.compareFaces(photoData);
      setFaceRecognitionResult(result);
      
      if (result.faceDetected) {
        if (result.isSamePerson) {
          addTestResult(`✅ 人脸识别成功: 同一人 (相似度: ${(result.confidence * 100).toFixed(1)}%)`);
        } else {
          addTestResult(`⚠️ 人脸识别结果: 不同人 (相似度: ${(result.confidence * 100).toFixed(1)}%)`);
        }
      } else {
        addTestResult('❌ 未检测到人脸');
      }
    } catch (error) {
      addTestResult('❌ 人脸识别失败');
      console.error('人脸识别失败:', error);
    }
  };

  // 初始化人脸识别
  const initializeFaceRecognition = async () => {
    addTestResult('🔄 初始化人脸识别...');
    const success = await faceRecognitionService.initialize();
    
    if (success) {
      addTestResult('✅ 人脸识别初始化成功');
      setFaceRecognitionStatus('人脸识别已就绪');
    } else {
      addTestResult('❌ 人脸识别初始化失败');
      setFaceRecognitionStatus('人脸识别初始化失败');
    }
  };

  // 清除参考人脸
  const clearReferenceFace = () => {
    faceRecognitionService.clearReferenceFace();
    setReferencePhoto('');
    setIsFaceRecognitionEnabled(false);
    setFaceRecognitionStatus('参考人脸已清除');
    addTestResult('🗑️ 参考人脸已清除');
  };

  useEffect(() => {
    startCamera();
    initializeFaceRecognition();
    return () => stopCamera();
  }, []);

  return (
    <div style={{
      padding: '20px',
      background: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>📷 摄像头与人脸识别测试</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* 控制面板 */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>🎮 控制面板</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <button onClick={startCamera} style={{ marginRight: '10px', padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              启动摄像头
            </button>
            <button onClick={stopCamera} style={{ marginRight: '10px', padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              停止摄像头
            </button>
            <button onClick={takePhoto} style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              拍照测试
            </button>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <button onClick={setReferenceFace} style={{ marginRight: '10px', padding: '8px 16px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              设置参考人脸
            </button>
            <button onClick={testFaceRecognition} style={{ marginRight: '10px', padding: '8px 16px', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              测试人脸识别
            </button>
            <button onClick={clearReferenceFace} style={{ padding: '8px 16px', background: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              清除参考人脸
            </button>
          </div>

          {error && (
            <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>
              <strong>错误:</strong> {error}
            </div>
          )}

          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>摄像头状态: {isCameraReady ? '✅ 就绪' : '⏳ 加载中'}</div>
            <div>人脸识别状态: {faceRecognitionStatus}</div>
            <div>参考人脸: {isFaceRecognitionEnabled ? '✅ 已设置' : '❌ 未设置'}</div>
          </div>
        </div>

        {/* 视频预览 */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>📹 视频预览</h3>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxWidth: '400px',
              height: '300px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: '#000'
            }}
          />
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* 拍摄的照片 */}
        {photoData && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>📸 拍摄的照片</h3>
            <img
              src={photoData}
              alt="拍摄的照片"
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                objectFit: 'contain'
              }}
            />
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              大小: {photoData.length} 字节
            </div>
          </div>
        )}

        {/* 参考人脸 */}
        {referencePhoto && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>👤 参考人脸</h3>
            <img
              src={referencePhoto}
              alt="参考人脸"
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
      </div>

      {/* 人脸识别结果 */}
      {faceRecognitionResult && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>🔍 人脸识别结果</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div><strong>检测到人脸:</strong> {faceRecognitionResult.faceDetected ? '✅ 是' : '❌ 否'}</div>
            <div><strong>是否为同一人:</strong> {faceRecognitionResult.isSamePerson ? '✅ 是' : '❌ 否'}</div>
            <div><strong>相似度:</strong> {(faceRecognitionResult.confidence * 100).toFixed(1)}%</div>
            {faceRecognitionResult.details && (
              <>
                <div><strong>距离:</strong> {faceRecognitionResult.details.distance?.toFixed(4)}</div>
                <div><strong>阈值:</strong> {faceRecognitionResult.details.threshold}</div>
                <div><strong>检测到的人脸数:</strong> {faceRecognitionResult.details.faceCount}</div>
              </>
            )}
            {faceRecognitionResult.error && (
              <div style={{ color: 'red' }}><strong>错误:</strong> {faceRecognitionResult.error}</div>
            )}
          </div>
        </div>
      )}

      {/* 测试日志 */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>📋 测试日志</h3>
        <div style={{ 
          height: '200px', 
          overflowY: 'auto', 
          background: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {testResults.length === 0 ? (
            <div style={{ color: '#999' }}>暂无测试记录</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>{result}</div>
            ))
          )}
        </div>
        <button 
          onClick={() => setTestResults([])}
          style={{ 
            marginTop: '10px', 
            padding: '6px 12px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          清除日志
        </button>
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