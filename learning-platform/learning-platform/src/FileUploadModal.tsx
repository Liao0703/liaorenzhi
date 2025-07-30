import React, { useState, useRef, useCallback } from 'react';
import { HybridStorageService } from './hybridStorageService';
import type { StorageFile } from './hybridStorageService';
import { isFileTypeSupported, getFileType, formatFileSize } from './fileUploadService';
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
        fileUrl: storageFile.localUrl || storageFile.ossUrl || '',
        fileName: storageFile.name
      });

      if (storageFile) {
        // 上传成功，返回文件信息
        const fileInfo: FileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          fileUrl: storageFile.localUrl || storageFile.ossUrl || '',
          fileType: getFileType(file.type),
          fileName: storageFile.name,
          fileId: storageFile.id,
          storageType: storageFile.ossUrl ? 'hybrid' : 'local'
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
    <div style={{
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
      padding: '20px'
    }}>
      <div style={{
        background: '#222',
        padding: '30px',
        borderRadius: '16px',
        maxWidth: 600,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#fff'
      }}>
        <h2 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>📄 上传文件到OSS</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📋 支持的文件类型</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8 }}>
            <p>• PDF文档 (.pdf)</p>
            <p>• Word文档 (.docx, .doc)</p>
            <p>• 文本文件 (.txt)</p>
            <p>• HTML文件 (.html)</p>
            <p>• JSON文件 (.json)</p>
          </div>
        </div>

        <div
          style={{
            border: `2px dashed ${isDragOver ? '#409eff' : '#444'}`,
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            background: isDragOver ? 'rgba(64, 158, 255, 0.1)' : 'transparent',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {isUploading ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h3 style={{ margin: '0 0 15px 0' }}>正在上传到OSS...</h3>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#333',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #409eff, #67c23a)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ fontSize: '14px', opacity: 0.8 }}>{uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
              <h3 style={{ margin: '0 0 10px 0' }}>拖拽文件到此处或点击选择</h3>
              <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '20px' }}>
                支持PDF、Word、TXT、HTML、JSON等格式
              </p>
              <button
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(90deg, #409eff 60%, #2b8cff 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
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
            marginTop: '20px',
            padding: '15px',
            borderRadius: '8px',
            background: uploadResult.success 
              ? 'rgba(103, 194, 58, 0.1)' 
              : 'rgba(245, 108, 108, 0.1)',
            border: `1px solid ${uploadResult.success ? '#67c23a' : '#f56c6c'}`
          }}>
            <h4 style={{ 
              margin: '0 0 10px 0', 
              color: uploadResult.success ? '#67c23a' : '#f56c6c' 
            }}>
              {uploadResult.success ? '✅ 上传成功' : '❌ 上传失败'}
            </h4>
            {uploadResult.success ? (
              <div style={{ fontSize: '14px' }}>
                <p><strong>文件URL:</strong> {uploadResult.fileUrl}</p>
                <p><strong>文件名:</strong> {uploadResult.fileName}</p>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#f56c6c' }}>
                {uploadResult.error}
              </p>
            )}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '20px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isUploading ? 0.5 : 1
            }}
          >
            关闭
          </button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.6 }}>
          <p><strong>注意：</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>文件将直接上传到阿里云OSS</li>
            <li>上传成功后，文件将在学习中心以嵌入式方式显示</li>
            <li>PDF文件将直接预览，Word文件将通过Office Online预览</li>
            <li>请确保OSS配置正确且Bucket为公共访问</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal; 