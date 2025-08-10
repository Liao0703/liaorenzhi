import React, { useState, useRef, useCallback } from 'react';
import { HybridStorageService } from './hybridStorageService';
// import type { StorageFile } from './hybridStorageService';
import { isFileTypeSupported, getFileType } from './fileUploadService';
import type { FileUploadResult } from './fileUploadService';

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileId: string;
  storageType: 'local' | 'oss' | 'hybrid';
}

interface FileUploadModalProps {
  show: boolean;
  onClose: () => void;
  onFileUploaded: (fileInfo: FileInfo) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ show, onClose, onFileUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!isFileTypeSupported(file.type)) {
      alert(`不支持的文件类型: ${file.type}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 使用混合存储服务上传文件
      const storageFile = await HybridStorageService.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult({
        success: true,
        fileUrl: storageFile.fileUrl || '',
        fileName: storageFile.fileName || file.name
      });

      if (storageFile.success) {
        // 上传成功，返回文件信息
        const fileInfo: FileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          fileUrl: storageFile.fileUrl || '',
          fileType: getFileType(file.type),
          fileName: storageFile.fileName || file.name,
          fileId: storageFile.fileId || Date.now().toString(),
          storageType: 'hybrid'
        };
        
        onFileUploaded(fileInfo);
        onClose();
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadResult({
        success: false,
        error: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!show) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(10px)'
      }}
      onClick={(e) => {
        // 点击遮罩层关闭模态框
        if (e.target === e.currentTarget && !isUploading) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          background: '#222',
          padding: '20px',
          borderRadius: '16px',
          maxWidth: 550,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          color: '#fff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏和关闭按钮 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>📄 上传文件</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: '5px',
              borderRadius: '4px',
              opacity: isUploading ? 0.5 : 0.7,
              transition: 'opacity 0.3s ease'
            }}
            onMouseOver={(e) => !isUploading && (e.currentTarget.style.opacity = '1')}
            onMouseOut={(e) => !isUploading && (e.currentTarget.style.opacity = '0.7')}
            title="关闭"
          >
            ✕
          </button>
        </div>
        
        {/* 文件类型说明 - 可折叠 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.8 }}>📋 支持的文件类型</h3>
          <div style={{ 
            fontSize: '12px', 
            lineHeight: '1.4', 
            opacity: 0.7,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>PDF</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Word</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>TXT</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>HTML</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>JSON</span>
          </div>
        </div>

        <div
          style={{
            border: `2px dashed ${isDragOver ? '#409eff' : '#444'}`,
            borderRadius: '12px',
            padding: '30px 20px',
            textAlign: 'center',
            background: isDragOver ? 'rgba(64, 158, 255, 0.1)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {isUploading ? (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>⏳</div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>正在上传文件...</h3>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#333',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #409eff, #67c23a)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>{uploadProgress}%</p>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>📁</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>拖拽文件到此处或点击选择</h3>
              <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '15px', margin: '0 0 15px 0' }}>
                支持PDF、Word、TXT、HTML、JSON等格式
              </p>
              <button
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg, #409eff 60%, #2b8cff 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                选择文件
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.html,.json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploadResult && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            borderRadius: '8px',
            background: uploadResult.success 
              ? 'rgba(103, 194, 58, 0.1)' 
              : 'rgba(245, 108, 108, 0.1)',
            border: `1px solid ${uploadResult.success ? '#67c23a' : '#f56c6c'}`
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              color: uploadResult.success ? '#67c23a' : '#f56c6c',
              fontSize: '14px' 
            }}>
              {uploadResult.success ? '✅ 上传成功' : '❌ 上传失败'}
            </h4>
            {uploadResult.success ? (
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                <p style={{ margin: '0 0 4px 0', wordBreak: 'break-all' }}>
                  <strong>文件URL:</strong> 
                  <span style={{ opacity: 0.8, fontSize: '11px' }}>{uploadResult.fileUrl}</span>
                </p>
                <p style={{ margin: 0, wordBreak: 'break-word' }}>
                  <strong>文件名:</strong> {uploadResult.fileName}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#f56c6c', margin: 0 }}>
                {uploadResult.error}
              </p>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '15px',
          justifyContent: 'center',
          paddingTop: '15px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              background: isUploading ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: isUploading ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseOut={(e) => !isUploading && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          >
            {isUploading ? '上传中...' : '关闭'}
          </button>
        </div>

        {/* 使用说明 - 简化版本 */}
        <div style={{ 
          marginTop: '12px', 
          fontSize: '10px', 
          opacity: 0.5, 
          textAlign: 'center',
          lineHeight: '1.3'
        }}>
          文件将上传到云服务器，支持在线预览和下载
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal; 