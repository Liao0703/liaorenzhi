import React, { useState, useEffect } from 'react';

interface ServerStatus {
  serverConnection: 'checking' | 'success' | 'error';
  apiStatus: 'checking' | 'success' | 'error';
  photoRecognition: 'checking' | 'success' | 'error';
  corsStatus: 'checking' | 'success' | 'error';
}

interface TestResult {
  timestamp: string;
  type: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const ServerStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<ServerStatus>({
    serverConnection: 'checking',
    apiStatus: 'checking',
    photoRecognition: 'checking',
    corsStatus: 'checking'
  });
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const getServerUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === '116.62.65.246' || 
        hostname === 'www.liaorenzhi.top' || 
        hostname === 'liaorenzhi.top' ||
        hostname.includes('vercel.app')) {
      return 'http://116.62.65.246:3001';
    }
    return 'http://localhost:3001';
  };
  const [serverUrl] = useState(getServerUrl());

  // 添加测试结果
  const addTestResult = (type: string, status: 'success' | 'error' | 'warning', message: string, details?: any) => {
    const result: TestResult = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      status,
      message,
      details
    };
    setTestResults(prev => [...prev, result]);
  };

  // 清除测试结果
  const clearTestResults = () => {
    setTestResults([]);
  };

  // 测试服务器连接
  const testServerConnection = async () => {
    setStatus(prev => ({ ...prev, serverConnection: 'checking' }));
    addTestResult('服务器连接', 'warning', '开始检查服务器连接...');

    try {
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult('服务器连接', 'success', `健康检查通过: ${JSON.stringify(data)}`, data);
        setStatus(prev => ({ ...prev, serverConnection: 'success' }));
      } else {
        addTestResult('服务器连接', 'error', `健康检查失败: ${response.status} ${response.statusText}`);
        setStatus(prev => ({ ...prev, serverConnection: 'error' }));
      }
    } catch (error) {
      addTestResult('服务器连接', 'error', `连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setStatus(prev => ({ ...prev, serverConnection: 'error' }));
    }
  };

  // 测试API状态
  const testAPIStatus = async () => {
    setStatus(prev => ({ ...prev, apiStatus: 'checking' }));
    addTestResult('API状态', 'warning', '开始检查API状态...');

    try {
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult('API状态', 'success', `API状态正常: ${JSON.stringify(data)}`, data);
        setStatus(prev => ({ ...prev, apiStatus: 'success' }));
      } else {
        addTestResult('API状态', 'error', `API检查失败: ${response.status} ${response.statusText}`);
        setStatus(prev => ({ ...prev, apiStatus: 'error' }));
      }
    } catch (error) {
      addTestResult('API状态', 'error', `API检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setStatus(prev => ({ ...prev, apiStatus: 'error' }));
    }
  };

  // 测试CORS状态
  const testCORSStatus = async () => {
    setStatus(prev => ({ ...prev, corsStatus: 'checking' }));
    addTestResult('CORS状态', 'warning', '开始检查CORS配置...');

    try {
      // 测试预检请求
      const preflightResponse = await fetch(`${serverUrl}/health`, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      if (preflightResponse.ok) {
        addTestResult('CORS状态', 'success', 'CORS预检请求成功');
        
        // 测试实际请求
        const actualResponse = await fetch(`${serverUrl}/health`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (actualResponse.ok) {
          const corsHeaders = {
            'Access-Control-Allow-Origin': actualResponse.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': actualResponse.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': actualResponse.headers.get('Access-Control-Allow-Headers')
          };
          
          addTestResult('CORS状态', 'success', 'CORS配置正常', corsHeaders);
          setStatus(prev => ({ ...prev, corsStatus: 'success' }));
        } else {
          addTestResult('CORS状态', 'error', 'CORS实际请求失败');
          setStatus(prev => ({ ...prev, corsStatus: 'error' }));
        }
      } else {
        addTestResult('CORS状态', 'error', 'CORS预检请求失败');
        setStatus(prev => ({ ...prev, corsStatus: 'error' }));
      }
    } catch (error) {
      addTestResult('CORS状态', 'error', `CORS检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setStatus(prev => ({ ...prev, corsStatus: 'error' }));
    }
  };

  // 测试照片识别功能
  const testPhotoRecognition = async () => {
    setStatus(prev => ({ ...prev, photoRecognition: 'checking' }));
    addTestResult('照片识别', 'warning', '开始检查照片识别功能...');

    try {
      // 检查主页面是否包含照片识别相关功能
      const mainResponse = await fetch(serverUrl, {
        method: 'GET',
        mode: 'cors'
      });

      if (mainResponse.ok) {
        const html = await mainResponse.text();
        
        // 检查关键功能模块
        const modules = [
          { name: 'CameraCapture', pattern: /CameraCapture/ },
          { name: 'FaceRecognition', pattern: /faceRecognition/ },
          { name: 'PhotoStorage', pattern: /photoStorage/ },
          { name: 'CameraTest', pattern: /camera-test/ }
        ];

        let foundModules = 0;
        modules.forEach(module => {
          if (module.pattern.test(html)) {
            addTestResult('照片识别', 'success', `找到模块: ${module.name}`);
            foundModules++;
          } else {
            addTestResult('照片识别', 'warning', `未找到模块: ${module.name}`);
          }
        });

        if (foundModules >= 2) {
          addTestResult('照片识别', 'success', `照片识别功能正常，找到 ${foundModules} 个模块`);
          setStatus(prev => ({ ...prev, photoRecognition: 'success' }));
        } else {
          addTestResult('照片识别', 'error', `照片识别功能不完整，仅找到 ${foundModules} 个模块`);
          setStatus(prev => ({ ...prev, photoRecognition: 'error' }));
        }
      } else {
        addTestResult('照片识别', 'error', '无法访问主页面');
        setStatus(prev => ({ ...prev, photoRecognition: 'error' }));
      }
    } catch (error) {
      addTestResult('照片识别', 'error', `照片识别检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setStatus(prev => ({ ...prev, photoRecognition: 'error' }));
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunningTests(true);
    clearTestResults();
    
    addTestResult('系统', 'warning', '开始运行所有测试...');
    
    await testServerConnection();
    await testAPIStatus();
    await testCORSStatus();
    await testPhotoRecognition();
    
    addTestResult('系统', 'success', '所有测试完成');
    setIsRunningTests(false);
  };

  // 页面加载时自动运行测试
  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'checking': return '⏳';
      default: return '⚠️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'checking': return '#ffc107';
      default: return '#6c757d';
    }
  };

  // 统一到浅色卡片风格
  const lightCard: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #eef0f4',
    borderRadius: 16,
    boxShadow: '0 6px 24px rgba(17,24,39,0.06)'
  };
  const subCard: React.CSSProperties = {
    background: '#f8fafc',
    border: '1px solid #eef2f7',
    borderRadius: 10
  };

  return (
    <div style={{ ...lightCard, padding: 20 }}>
      <h2 style={{
        color: '#333',
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🌐 服务器状态监控
      </h2>

      {/* 服务器信息 */}
      <div style={{ ...subCard, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>服务器地址:</strong> {serverUrl}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          最后更新: {new Date().toLocaleString('zh-CN')}
        </div>
      </div>

      {/* 状态概览 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{
          ...subCard,
          padding: 16,
          border: `2px solid ${getStatusColor(status.serverConnection)}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {getStatusIcon(status.serverConnection)}
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>服务器连接</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {status.serverConnection === 'checking' && '检查中...'}
            {status.serverConnection === 'success' && '连接正常'}
            {status.serverConnection === 'error' && '连接失败'}
          </div>
        </div>

        <div style={{
          ...subCard,
          padding: 16,
          border: `2px solid ${getStatusColor(status.apiStatus)}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {getStatusIcon(status.apiStatus)}
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>API状态</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {status.apiStatus === 'checking' && '检查中...'}
            {status.apiStatus === 'success' && 'API正常'}
            {status.apiStatus === 'error' && 'API异常'}
          </div>
        </div>

        <div style={{
          ...subCard,
          padding: 16,
          border: `2px solid ${getStatusColor(status.corsStatus)}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {getStatusIcon(status.corsStatus)}
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CORS配置</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {status.corsStatus === 'checking' && '检查中...'}
            {status.corsStatus === 'success' && '配置正常'}
            {status.corsStatus === 'error' && '配置异常'}
          </div>
        </div>

        <div style={{
          ...subCard,
          padding: 16,
          border: `2px solid ${getStatusColor(status.photoRecognition)}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {getStatusIcon(status.photoRecognition)}
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>照片识别</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {status.photoRecognition === 'checking' && '检查中...'}
            {status.photoRecognition === 'success' && '功能正常'}
            {status.photoRecognition === 'error' && '功能异常'}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={runAllTests}
          disabled={isRunningTests}
          style={{
            background: isRunningTests ? '#9ca3af' : '#111827',
            color: '#fff',
            border: '1px solid #111827',
            padding: '8px 14px',
            borderRadius: 10,
            fontSize: 13,
            cursor: isRunningTests ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            marginRight: 8
          }}
        >
          {isRunningTests ? '⏳ 测试中...' : '🔄 重新测试'}
        </button>
        
        <button
          onClick={clearTestResults}
          style={{
            background: '#fff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            padding: '8px 14px',
            borderRadius: 10,
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          🗑️ 清除日志
        </button>
      </div>

      {/* 测试日志 */}
      <div>
        <h3 style={{
          color: '#333',
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📋 测试日志
          <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
            ({testResults.length} 条记录)
          </span>
        </h3>
        
        <div style={{ ...subCard, padding: 16, maxHeight: 400, overflowY: 'auto' }}>
          {testResults.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
              暂无测试记录
            </div>
          ) : (
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '8px',
                    padding: '8px',
                    borderRadius: '4px',
                    background: result.status === 'success' ? '#d4edda' : 
                               result.status === 'error' ? '#f8d7da' : '#fff3cd',
                    border: `1px solid ${result.status === 'success' ? '#c3e6cb' : 
                                       result.status === 'error' ? '#f5c6cb' : '#ffeaa7'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: result.status === 'success' ? '#155724' : 
                                       result.status === 'error' ? '#721c24' : '#856404' }}>
                      {getStatusIcon(result.status)}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>[{result.timestamp}]</span>
                    <span style={{ fontWeight: 'bold' }}>{result.type}:</span>
                    <span>{result.message}</span>
                  </div>
                  {result.details && (
                    <div style={{ 
                      marginLeft: '20px', 
                      fontSize: '11px', 
                      color: '#666',
                      background: 'rgba(0,0,0,0.05)',
                      padding: '4px',
                      borderRadius: '2px'
                    }}>
                      {JSON.stringify(result.details, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 快速访问链接 */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{
          color: '#333',
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🔗 快速访问
        </h3>
        
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={serverUrl} target="_blank" rel="noopener noreferrer">
            <button style={{
              background: '#fff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 13,
              cursor: 'pointer'
            }}>
              🌐 访问主页面
            </button>
          </a>
          
          <a href={`${serverUrl}/camera-test`} target="_blank" rel="noopener noreferrer">
            <button style={{
              background: '#fff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 13,
              cursor: 'pointer'
            }}>
              📷 摄像头测试
            </button>
          </a>
          
          <a href={`${serverUrl}/health`} target="_blank" rel="noopener noreferrer">
            <button style={{
              background: '#111827',
              color: '#fff',
              border: '1px solid #111827',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 13,
              cursor: 'pointer'
            }}>
              🔧 健康检查
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ServerStatusPanel; 