// 混合存储服务 - 本地存储 + 云服务器存储
import { uploadFileToServer, getServerFileList, deleteServerFile, STORAGE_CONFIG } from './fileUploadService';

console.log('🔧 混合存储服务已恢复：本地存储 + 云服务器存储');

// 文件上传结果接口
export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileId?: string;
  fileType?: string;
  fileSize?: number;
  error?: string;
}

export interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  localUrl?: string; // 本地存储URL
  serverUrl?: string; // 云服务器URL
  uploadTime: string;
  lastAccessTime: string;
  accessCount: number;
  storageType: 'local' | 'server' | 'hybrid'; // 存储类型
}

export interface StorageStats {
  localFiles: number;
  serverFiles: number;
  totalSize: number;
  localSize: number;
  serverSize: number;
}

// 本地存储管理
class LocalFileStorage {
  private static readonly STORAGE_KEY = 'learning_local_files';
  private static readonly MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100MB

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

  // 保存文件到本地
  static async saveFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // 检查存储空间
      if (!this.hasSpace(file.size)) {
        await this.cleanup();
        if (!this.hasSpace(file.size)) {
          throw new Error('本地存储空间不足');
        }
      }

      // 将文件转换为base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const url = `data:${file.type};base64,${base64}`;

      const storageFile: StorageFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        localUrl: url,
        uploadTime: new Date().toISOString(),
        lastAccessTime: new Date().toISOString(),
        accessCount: 0,
        storageType: 'local'
      };

      this.addFile(storageFile);

      return { success: true, url };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '保存失败' };
    }
  }

  // 添加文件记录
  static addFile(file: StorageFile): void {
    const files = this.getFiles();
    files.push(file);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
  }

  // 删除文件
  static removeFile(fileId: string): boolean {
    try {
      const files = this.getFiles();
      const updatedFiles = files.filter(f => f.id !== fileId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFiles));
      return true;
    } catch (error) {
      console.error('删除本地文件失败:', error);
      return false;
    }
  }

  // 检查存储空间
  static hasSpace(fileSize: number): boolean {
    const currentSize = this.getCurrentSize();
    return (currentSize + fileSize) <= this.MAX_STORAGE_SIZE;
  }

  // 获取当前存储大小
  static getCurrentSize(): number {
    const files = this.getFiles();
    return files.reduce((sum, file) => sum + file.size, 0);
  }

  // 清理旧文件
  static async cleanup(): Promise<void> {
    console.log('开始清理本地存储...');
    const files = this.getFiles();
    
    // 按访问时间排序，删除最久未访问的文件
    files.sort((a, b) => new Date(a.lastAccessTime).getTime() - new Date(b.lastAccessTime).getTime());
    
    let currentSize = this.getCurrentSize();
    const targetSize = this.MAX_STORAGE_SIZE * 0.7; // 清理到70%
    
    for (const file of files) {
      if (currentSize <= targetSize) break;
      
      // 只清理已同步到服务器的文件
      if (file.serverUrl) {
        this.removeFile(file.id);
        currentSize -= file.size;
        console.log(`已清理文件: ${file.name}`);
      }
    }
  }

  // 更新访问时间
  static updateAccessTime(fileId: string): void {
    const files = this.getFiles();
    const file = files.find(f => f.id === fileId);
    if (file) {
      file.lastAccessTime = new Date().toISOString();
      file.accessCount++;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    }
  }

  // 获取存储统计
  static getStats(): { files: number; size: number } {
    const files = this.getFiles();
    return {
      files: files.length,
      size: files.reduce((sum, file) => sum + file.size, 0)
    };
  }
}

// 云服务器存储管理
class ServerFileStorage {

  // 获取云服务器文件列表
  static async getFiles(): Promise<StorageFile[]> {
    try {
      // 从云服务器获取文件列表
      const serverFiles = await getServerFileList();
      
      // 转换格式
      return serverFiles.map(file => ({
        id: file.filename || file.name,
        name: file.originalName || file.filename,
        size: file.size || 0,
        type: this.getFileTypeFromName(file.filename),
        serverUrl: file.downloadUrl,
        uploadTime: file.uploadTime || new Date().toISOString(),
        lastAccessTime: new Date().toISOString(),
        accessCount: 0,
        storageType: 'server' as const
      }));
    } catch (error) {
      console.error('获取云服务器文件列表失败:', error);
      return [];
    }
  }

  // 从文件名推断文件类型
  private static getFileTypeFromName(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'html': 'text/html',
      'json': 'application/json',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    return typeMap[ext || ''] || 'application/octet-stream';
  }

  // 添加文件记录
  static addFile(file: StorageFile): void {
    console.log('文件已添加到云服务器:', file.name);
  }

  // 删除文件
  static async removeFile(fileId: string): Promise<boolean> {
    try {
      return await deleteServerFile(fileId);
    } catch (error) {
      console.error('删除云服务器文件失败:', error);
    return false;
  }
  }

  // 获取存储统计
  static async getStats(): Promise<{ files: number; size: number }> {
    try {
      const files = await this.getFiles();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        files: files.length,
        size: totalSize
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return {
        files: 0,
        size: 0
      };
    }
    }
  }

// 混合存储服务类 - 本地存储 + 云服务器存储
export class HybridStorageService {
  // 文件上传 - 混合存储策略
  static async uploadFile(file: File): Promise<FileUploadResult> {
    console.log(`📤 上传文件: ${file.name} (${this.formatBytes(file.size)})`);
    
    let localResult = null;
    let serverResult = null;
    
    // 1. 首先尝试保存到本地存储
    try {
      console.log('📱 尝试保存到本地存储...');
      localResult = await LocalFileStorage.saveFile(file);
      if (localResult.success) {
        console.log('✅ 本地存储成功');
      } else {
        console.warn('⚠️ 本地存储失败:', localResult.error);
      }
    } catch (error) {
      console.warn('⚠️ 本地存储异常:', error);
    }
    
    // 2. 同时尝试上传到云服务器（作为备份）
    try {
      console.log('☁️ 同时上传到云服务器...');
      const uploadResult = await uploadFileToServer(file);
      
      if (uploadResult.success) {
        console.log('✅ 云服务器上传成功');
        serverResult = uploadResult;
        
        // 如果本地存储成功，将云服务器URL添加到本地记录
        if (localResult?.success) {
          this.updateLocalFileWithServerInfo(file.name, uploadResult.fileUrl, uploadResult.fileId);
        }
      } else {
        console.warn('⚠️ 云服务器上传失败:', uploadResult.error);
      }
    } catch (error) {
      console.warn('⚠️ 云服务器上传异常:', error);
    }
    
    // 3. 根据上传结果决定返回内容
    if (localResult?.success || serverResult?.success) {
      const fileId = serverResult?.fileId || Date.now().toString();
      
      return {
        success: true,
        fileUrl: localResult?.url || serverResult?.fileUrl,
        fileName: serverResult?.fileName || file.name,
        fileId: fileId,
        fileType: serverResult?.fileType || file.type,
        fileSize: serverResult?.fileSize || file.size
      };
    } else {
      return {
        success: false,
        error: '本地存储和云服务器上传都失败了'
      };
    }
  }

  // 更新本地文件的服务器信息
  private static updateLocalFileWithServerInfo(fileName: string, serverUrl?: string, serverId?: string) {
    try {
      const localFiles = LocalFileStorage.getFiles();
      const fileIndex = localFiles.findIndex(f => f.name === fileName);
      
      if (fileIndex !== -1) {
        localFiles[fileIndex].serverUrl = serverUrl;
        localFiles[fileIndex].storageType = 'hybrid';
        if (serverId) {
          localFiles[fileIndex].id = serverId;
        }
        localStorage.setItem('learning_local_files', JSON.stringify(localFiles));
        console.log('✅ 已更新本地文件的服务器信息');
      }
    } catch (error) {
      console.error('更新本地文件服务器信息失败:', error);
    }
  }

  // 格式化字节数
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取所有文件 - 合并本地和服务器文件
  static async getAllFiles(): Promise<StorageFile[]> {
    const localFiles = LocalFileStorage.getFiles();
    const serverFiles = await ServerFileStorage.getFiles();
    
    // 合并文件，避免重复（优先使用本地文件）
    const allFiles = new Map<string, StorageFile>();
    
    // 先添加服务器文件
    serverFiles.forEach(file => {
      allFiles.set(file.name, file);
    });
    
    // 再添加本地文件（会覆盖同名的服务器文件）
    localFiles.forEach(file => {
      const existingFile = allFiles.get(file.name);
      if (existingFile && existingFile.serverUrl && !file.serverUrl) {
        // 如果服务器有这个文件但本地记录没有服务器URL，更新它
        file.serverUrl = existingFile.serverUrl;
        file.storageType = 'hybrid';
      }
      allFiles.set(file.name, file);
    });
    
    return Array.from(allFiles.values());
  }
    
  // 获取存储统计
  static async getStorageStats(): Promise<StorageStats> {
    const localStats = LocalFileStorage.getStats();
    const serverStats = await ServerFileStorage.getStats();
    
    return {
      localFiles: localStats.files,
      serverFiles: serverStats.files,
      totalSize: localStats.size + serverStats.size,
      localSize: localStats.size,
      serverSize: serverStats.size
    };
  }

  // 删除文件 - 从本地和服务器同时删除
  static async deleteFile(fileId: string): Promise<boolean> {
    let localDeleted = false;
    let serverDeleted = false;
    
    // 尝试从本地删除
    try {
      localDeleted = LocalFileStorage.removeFile(fileId);
      if (localDeleted) {
        console.log('✅ 本地文件删除成功');
      }
    } catch (error) {
      console.warn('⚠️ 本地文件删除失败:', error);
    }
    
    // 尝试从服务器删除
    try {
      serverDeleted = await ServerFileStorage.removeFile(fileId);
      if (serverDeleted) {
        console.log('✅ 服务器文件删除成功');
      }
    } catch (error) {
      console.warn('⚠️ 服务器文件删除失败:', error);
    }
    
    return localDeleted || serverDeleted;
  }

  // 清理本地缓存
  static async clearLocalCache(): Promise<void> {
    await LocalFileStorage.cleanup();
    console.log('✅ 本地缓存清理完成');
  }

  // 同步到云服务器
  static async syncToServer(): Promise<{ success: number; failed: number }> {
    const localFiles = LocalFileStorage.getFiles();
    let success = 0;
    let failed = 0;
    
    for (const localFile of localFiles) {
      // 跳过已经同步的文件
      if (localFile.serverUrl) {
        continue;
      }
      
      try {
        // 从本地文件重新创建File对象进行上传
        if (localFile.localUrl && localFile.localUrl.startsWith('data:')) {
          const response = await fetch(localFile.localUrl);
          const blob = await response.blob();
          const file = new File([blob], localFile.name, { type: localFile.type });
          
          const result = await uploadFileToServer(file);
          if (result.success) {
            // 更新本地记录
            this.updateLocalFileWithServerInfo(localFile.name, result.fileUrl, result.fileId);
            success++;
            console.log(`✅ 同步成功: ${localFile.name}`);
          } else {
            failed++;
            console.warn(`❌ 同步失败: ${localFile.name}`, result.error);
          }
        }
      } catch (error) {
        failed++;
        console.error(`❌ 同步异常: ${localFile.name}`, error);
      }
    }
    
    console.log(`🔄 同步完成: 成功 ${success} 个，失败 ${failed} 个`);
    return { success, failed };
  }

  // 导出数据
  static async exportData(): Promise<{
    files: StorageFile[];
    stats: StorageStats;
    config: typeof STORAGE_CONFIG;
  }> {
    const files = await this.getAllFiles();
    const stats = await this.getStorageStats();

    return {
      files,
      stats,
      config: STORAGE_CONFIG
    };
  }

  // 获取文件访问URL（智能选择本地或服务器）
  static getFileUrl(file: StorageFile): string {
    // 优先使用本地URL（速度最快）
    if (file.localUrl) {
      // 更新访问统计
      LocalFileStorage.updateAccessTime(file.id);
      return file.localUrl;
    }
    
    // 回退到服务器URL
    if (file.serverUrl) {
      return file.serverUrl;
    }
    
    throw new Error('文件URL不可用');
  }
}

// 存储配置状态
export const getStorageStatus = () => {
  const localStats = LocalFileStorage.getStats();
  
  return {
    ossEnabled: false,
    localEnabled: true,
    serverEnabled: true,
    currentStorage: 'hybrid',
    message: '混合存储：本地存储 + 云服务器',
    localStats: {
      files: localStats.files,
      size: localStats.size,
      maxSize: 100 * 1024 * 1024, // 100MB
      usage: localStats.size / (100 * 1024 * 1024) * 100
    },
    config: STORAGE_CONFIG
  };
};

// 混合存储恢复成功的提示
console.log('✅ 混合存储已恢复！');
console.log('📱 本地存储：快速访问，100MB限制');
console.log('☁️ 云服务器：无限容量，网络备份');
console.log('🔄 智能策略：本地优先，服务器备份');
console.log('📊 当前状态:', getStorageStatus()); 
console.log('📁 云服务器配置:', STORAGE_CONFIG.serverConfig); 