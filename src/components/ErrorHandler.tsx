import React from 'react';

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

export default ErrorHandler;