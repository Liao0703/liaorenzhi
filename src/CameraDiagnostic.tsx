import React, { useState, useEffect } from 'react';

interface CameraDiagnosticProps {
  onClose: () => void;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: string;
}

interface DiagnosticResult {
  browserSupport: boolean;
  httpsEnvironment: boolean;
  deviceCount: number;
  devices: DeviceInfo[];
  permissions: string;
  error?: string;
}

const CameraDiagnostic: React.FC<CameraDiagnosticProps> = ({ onClose }) => {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const result: DiagnosticResult = {
      browserSupport: false,
      httpsEnvironment: false,
      deviceCount: 0,
      devices: [],
      permissions: 'unknown'
    };

    try {
      // 检查浏览器支持
      result.browserSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // 检查HTTPS环境
      result.httpsEnvironment = location.protocol === 'https:' || 
                               location.hostname === 'localhost' || 
                               location.hostname === '127.0.0.1';
      
      // 检查设备
      if (result.browserSupport) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          result.devices = videoDevices.map(d => ({
            deviceId: d.deviceId,
            label: d.label || `摄像头 ${d.deviceId.slice(0, 8)}`,
            kind: d.kind
          }));
          result.deviceCount = videoDevices.length;
        } catch (err) {
          result.error = `枚举设备失败: ${err instanceof Error ? err.message : '未知错误'}`;
        }
      }
      
      // 检查权限
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        result.permissions = 'granted';
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            result.permissions = 'denied';
          } else if (err.name === 'NotFoundError') {
            result.permissions = 'no-device';
          } else {
            result.permissions = 'error';
            result.error = err.message;
          }
        } else {
          result.permissions = 'error';
          result.error = '未知错误';
        }
      }
      
    } catch (err) {
      result.error = err instanceof Error ? err.message : '诊断失败';
    }
    
    setDiagnosticResult(result);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusColor = (status: boolean) => status ? '#67c23a' : '#f56c6c';
  const getStatusIcon = (status: boolean) => status ? '✅' : '❌';

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'granted': return '已授权';
      case 'denied': return '已拒绝';
      case 'no-device': return '无设备';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'granted': return '#67c23a';
      case 'denied': return '#f56c6c';
      case 'no-device': return '#e6a23c';
      case 'error': return '#f56c6c';
      default: return '#909399';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.9)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#fff' }}>📷 摄像头诊断工具</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>

        {isRunning ? (
          <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
            <div>正在诊断摄像头...</div>
          </div>
        ) : diagnosticResult ? (
          <div style={{ color: '#fff' }}>
            {/* 诊断结果 */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px' }}>诊断结果</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: `2px solid ${getStatusColor(diagnosticResult.browserSupport)}`
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                    {getStatusIcon(diagnosticResult.browserSupport)} 浏览器支持
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {diagnosticResult.browserSupport ? '支持摄像头功能' : '不支持摄像头功能'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: `2px solid ${getStatusColor(diagnosticResult.httpsEnvironment)}`
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                    {getStatusIcon(diagnosticResult.httpsEnvironment)} HTTPS环境
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {diagnosticResult.httpsEnvironment ? '安全环境' : '非安全环境'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: `2px solid ${getStatusColor(diagnosticResult.deviceCount > 0)}`
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                    {getStatusIcon(diagnosticResult.deviceCount > 0)} 摄像头设备
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    检测到 {diagnosticResult.deviceCount} 个设备
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: `2px solid ${getPermissionColor(diagnosticResult.permissions)}`
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>
                    {diagnosticResult.permissions === 'granted' ? '✅' : '❌'} 权限状态
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {getPermissionText(diagnosticResult.permissions)}
                  </div>
                </div>
              </div>
            </div>

            {/* 设备列表 */}
            {diagnosticResult.devices.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>检测到的摄像头设备：</h4>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  {diagnosticResult.devices.map((device, index) => (
                    <div key={device.deviceId} style={{
                      padding: '8px',
                      marginBottom: '5px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      📹 {device.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {diagnosticResult.error && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px', color: '#f56c6c' }}>错误信息：</h4>
                <div style={{
                  background: 'rgba(244, 108, 108, 0.2)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(244, 108, 108, 0.3)',
                  fontSize: '14px'
                }}>
                  {diagnosticResult.error}
                </div>
              </div>
            )}

            {/* 解决方案 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>解决方案：</h4>
              <div style={{
                background: 'rgba(103, 194, 58, 0.1)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid rgba(103, 194, 58, 0.3)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                {!diagnosticResult.browserSupport && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>浏览器不支持：</strong>请使用Chrome、Firefox、Safari等现代浏览器
                  </div>
                )}
                {!diagnosticResult.httpsEnvironment && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>非安全环境：</strong>摄像头功能在非HTTPS环境下可能受限，建议使用HTTPS
                  </div>
                )}
                {diagnosticResult.deviceCount === 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>无摄像头设备：</strong>
                    <ul style={{ margin: '5px 0 0 20px' }}>
                      <li>检查摄像头是否正确连接</li>
                      <li>确保摄像头未被其他应用占用</li>
                      <li>尝试重新插拔摄像头</li>
                      <li>检查系统摄像头驱动</li>
                    </ul>
                  </div>
                )}
                {diagnosticResult.permissions === 'denied' && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>权限被拒绝：</strong>
                    <ul style={{ margin: '5px 0 0 20px' }}>
                      <li>点击地址栏左侧的摄像头图标</li>
                      <li>选择"允许"摄像头访问</li>
                      <li>刷新页面重试</li>
                    </ul>
                  </div>
                )}
                {diagnosticResult.permissions === 'no-device' && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>无可用设备：</strong>请检查摄像头连接和系统设置
                  </div>
                )}
                {diagnosticResult.permissions === 'granted' && diagnosticResult.deviceCount > 0 && (
                  <div style={{ color: '#67c23a' }}>
                    <strong>✅ 摄像头状态正常</strong>：可以正常使用学习监控功能
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={runDiagnostic}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                重新诊断
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                刷新页面
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CameraDiagnostic; 