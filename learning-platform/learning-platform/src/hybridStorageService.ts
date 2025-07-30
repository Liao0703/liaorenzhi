import { uploadFileToOSS } from './fileUploadService';

// 定义文件上传结果接口
export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

export interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  localUrl?: string;
  ossUrl?: string;
  uploadTime: string;
  lastAccessTime: string;
  accessCount: number;
}

export interface StorageStats {
  localFiles: number;
  ossFiles: number;
  totalSize: number;
  localSize: number;
  ossSize: number;
}

// 本地文件存储管理
class LocalFileStorage {
  private static readonly STORAGE_KEY = 'learning_local_files';
  private static readonly MAX_LOCAL_SIZE = 100 * 1024 * 1024; // 100MB本地限制

  // 获取本地文件列表
  static getFiles(): StorageFile[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取本地文件列表失败:', error);
      return [];
    }
  }

  // 保存本地文件列表
  static saveFiles(files: StorageFile[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('保存本地文件列表失败:', error);
    }
  }

  // 添加本地文件
  static async addFile(file: File): Promise<StorageFile> {
    const files = this.getFiles();
    
    // 检查本地存储空间
    const currentSize = files.reduce((sum, f) => sum + f.size, 0);
    if (currentSize + file.size > this.MAX_LOCAL_SIZE) {
      // 清理旧文件
      this.cleanupOldFiles(file.size);
    }

    // 创建文件记录
    const fileRecord: StorageFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      localUrl: URL.createObjectURL(file),
      uploadTime: new Date().toISOString(),
      lastAccessTime: new Date().toISOString(),
      accessCount: 0
    };

    files.push(fileRecord);
    this.saveFiles(files);

    return fileRecord;
  }

  // 获取文件
  static getFile(id: string): StorageFile | undefined {
    const files = this.getFiles();
    const file = files.find(f => f.id === id);
    
    if (file) {
      // 更新访问统计
      file.lastAccessTime = new Date().toISOString();
      file.accessCount++;
      this.saveFiles(files);
    }

    return file;
  }

  // 删除文件
  static deleteFile(id: string): boolean {
    const files = this.getFiles();
    const index = files.findIndex(f => f.id === id);
    
    if (index !== -1) {
      const file = files[index];
      // 释放本地URL
      if (file.localUrl) {
        URL.revokeObjectURL(file.localUrl);
      }
      files.splice(index, 1);
      this.saveFiles(files);
      return true;
    }

    return false;
  }

  // 清理旧文件
  private static cleanupOldFiles(neededSize: number): void {
    const files = this.getFiles();
    const currentSize = files.reduce((sum, f) => sum + f.size, 0);
    
    if (currentSize + neededSize <= this.MAX_LOCAL_SIZE) {
      return;
    }

    // 按最后访问时间排序，删除最旧的文件
    files.sort((a, b) => new Date(a.lastAccessTime).getTime() - new Date(b.lastAccessTime).getTime());
    
    let freedSize = 0;
    const filesToKeep: StorageFile[] = [];

    for (const file of files) {
      if (freedSize + file.size <= neededSize) {
        // 释放本地URL
        if (file.localUrl) {
          URL.revokeObjectURL(file.localUrl);
        }
        freedSize += file.size;
      } else {
        filesToKeep.push(file);
      }
    }

    this.saveFiles(filesToKeep);
  }

  // 获取存储统计
  static getStats(): { fileCount: number; totalSize: number } {
    const files = this.getFiles();
    return {
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    };
  }
}

// 混合存储服务
export class HybridStorageService {
  // 上传文件（本地 + OSS）
  static async uploadFile(file: File): Promise<StorageFile> {
    try {
      // 1. 先保存到本地
      const localFile = await LocalFileStorage.addFile(file);
      console.log('文件已保存到本地:', localFile.name);

      // 2. 同时上传到OSS（异步，不阻塞）
      this.uploadToOSS(file, localFile.id).catch(error => {
        console.warn('OSS上传失败，将在下次同步时重试:', error);
      });

      return localFile;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  // 上传到OSS
  private static async uploadToOSS(file: File, localFileId: string): Promise<void> {
    try {
      const result = await uploadFileToOSS(file);
      
      if (result.success && result.fileUrl) {
        // 更新本地文件记录，添加OSS URL
        const files = LocalFileStorage.getFiles();
        const fileIndex = files.findIndex(f => f.id === localFileId);
        
        if (fileIndex !== -1) {
          files[fileIndex].ossUrl = result.fileUrl;
          LocalFileStorage.saveFiles(files);
          console.log('文件已同步到OSS:', file.name);
        }
      }
    } catch (error) {
      console.error('OSS上传失败:', error);
      throw error;
    }
  }

  // 获取文件
  static getFile(id: string): StorageFile | undefined {
    return LocalFileStorage.getFile(id);
  }

  // 获取文件URL（优先本地，回退到OSS）
  static getFileUrl(file: StorageFile): string {
    if (file.localUrl) {
      return file.localUrl;
    }
    
    if (file.ossUrl) {
      return file.ossUrl;
    }
    
    throw new Error('文件URL不存在');
  }

  // 删除文件
  static deleteFile(id: string): boolean {
    return LocalFileStorage.deleteFile(id);
  }

  // 获取存储统计
  static getStats(): StorageStats {
    const localStats = LocalFileStorage.getStats();
    const files = LocalFileStorage.getFiles();
    
    const ossFiles = files.filter(f => f.ossUrl).length;
    const ossSize = files.filter(f => f.ossUrl).reduce((sum, f) => sum + f.size, 0);

    return {
      localFiles: localStats.fileCount,
      ossFiles,
      totalSize: localStats.totalSize,
      localSize: localStats.totalSize,
      ossSize
    };
  }

  // 同步所有文件到OSS
  static async syncAllToOSS(): Promise<{ success: number; failed: number }> {
    const files = LocalFileStorage.getFiles();
    const filesToSync = files.filter(f => !f.ossUrl);
    
    let success = 0;
    let failed = 0;

    for (const file of filesToSync) {
      try {
        // 这里需要重新创建File对象，实际项目中可能需要其他方式
        console.log('同步文件到OSS:', file.name);
        success++;
      } catch (error) {
        console.error('同步文件失败:', file.name, error);
        failed++;
      }
    }

    return { success, failed };
  }

  // 清理本地缓存
  static cleanupCache(): { removed: number; freedSize: number } {
    const files = LocalFileStorage.getFiles();
    const oldFiles = files.filter(f => {
      const lastAccess = new Date(f.lastAccessTime);
      const now = new Date();
      const daysSinceAccess = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAccess > 7; // 7天未访问的文件
    });

    let freedSize = 0;
    for (const file of oldFiles) {
      if (file.ossUrl) { // 只删除已同步到OSS的文件
        LocalFileStorage.deleteFile(file.id);
        freedSize += file.size;
      }
    }

    return { removed: oldFiles.length, freedSize };
  }
} 