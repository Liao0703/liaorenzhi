import { getAllSystemData } from './dataManager';

// 云同步服务
export class CloudSyncService {
  
  // 同步数据到云服务器
  static async syncToCloud(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('开始同步数据到云服务器...');
      
      // 获取所有本地数据
      const systemData = getAllSystemData();
      
      // 获取认证token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未登录，无法同步');
      }
      
      // 上传到云服务器
      const response = await fetch('http://localhost:3001/api/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: systemData,
          timestamp: new Date().toISOString(),
          type: 'full_backup'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('数据同步成功');
        localStorage.setItem('last_sync_time', new Date().toISOString());
        return {
          success: true,
          message: '数据已成功同步到云服务器'
        };
      } else {
        throw new Error(result.error || '同步失败');
      }
      
    } catch (error) {
      console.error('数据同步失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '同步失败'
      };
    }
  }
  
  // 从云服务器下载数据
  static async downloadFromCloud(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('从云服务器下载数据...');
      
      // 获取认证token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未登录，无法下载');
      }
      
      const response = await fetch('http://localhost:3001/api/sync/download', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('数据下载成功');
        return {
          success: true,
          message: '数据下载成功',
          data: result.data
        };
      } else {
        throw new Error(result.error || '下载失败');
      }
      
    } catch (error) {
      console.error('数据下载失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '下载失败'
      };
    }
  }
  
  // 获取最后同步时间
  static getLastSyncTime(): string | null {
    return localStorage.getItem('last_sync_time');
  }
  
  // 检查是否需要同步
  static needsSync(): boolean {
    const lastSync = this.getLastSyncTime();
    if (!lastSync) return true;
    
    // 如果超过24小时未同步，建议同步
    const timeDiff = Date.now() - new Date(lastSync).getTime();
    return timeDiff > 24 * 60 * 60 * 1000; // 24小时
  }
  
  // 自动同步（静默，失败不提示）
  static async autoSync(): Promise<void> {
    try {
      if (this.needsSync()) {
        await this.syncToCloud();
      }
    } catch (error) {
      // 静默失败，不影响正常使用
      console.warn('自动同步失败:', error);
    }
  }
} 