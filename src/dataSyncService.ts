// 数据同步服务 - 解决数据持久化和同步问题
import type { ArticleData } from './articleData';
import { HybridStorageService } from './hybridStorageService';

export interface SyncStatus {
  lastSync: Date;
  isOnline: boolean;
  pendingChanges: number;
}

class DataSyncService {
  private syncInterval: number | null = null;
  private pendingChanges: Set<string> = new Set();
  private lastSyncTime: Date = new Date();

  constructor() {
    this.startAutoSync();
    this.setupStorageListener();
  }

  // 启动自动同步
  private startAutoSync() {
    // 每30秒检查一次同步
    this.syncInterval = window.setInterval(() => {
      this.syncData();
    }, 30000);
  }

  // 设置存储监听器
  private setupStorageListener() {
    // 监听 localStorage 变化
    window.addEventListener('storage', (e) => {
      if (e.key === 'learning_articles') {
        console.log('检测到其他标签页的数据变化，重新加载数据');
        this.reloadData();
      }
    });
  }

  // 同步数据
  private async syncData() {
    try {
      // 1. 同步到云存储
      await this.syncToCloud();
      
      // 2. 从云存储同步回来
      await this.syncFromCloud();
      
      this.lastSyncTime = new Date();
      this.pendingChanges.clear();
      
      console.log('数据同步完成');
    } catch (error) {
      console.error('数据同步失败:', error);
    }
  }

  // 同步到云存储
  private async syncToCloud() {
    try {
      const articles = this.getLocalArticles();
      const syncData = {
        articles,
        lastUpdate: new Date().toISOString(),
        version: '1.0'
      };

      // 保存到混合存储
      const blob = new Blob([JSON.stringify(syncData)], { type: 'application/json' });
      const file = new File([blob], 'articles_sync.json', { type: 'application/json' });
      await HybridStorageService.uploadFile(file);
      
      console.log('数据已同步到云存储');
    } catch (error) {
      console.error('同步到云存储失败:', error);
    }
  }

  // 从云存储同步
  private async syncFromCloud() {
    try {
      // 这里需要实现从混合存储获取文件的方法
      // 暂时使用本地存储作为备选方案
      const localBackup = localStorage.getItem('articles_sync_backup');
      if (localBackup) {
        const parsed = JSON.parse(localBackup);
        const localArticles = this.getLocalArticles();
        
        // 合并数据，保留最新的
        const mergedArticles = this.mergeArticles(localArticles, parsed.articles);
        
        // 保存合并后的数据
        this.saveLocalArticles(mergedArticles);
        
        console.log('从本地备份同步数据完成');
      }
    } catch (error) {
      console.error('从云存储同步失败:', error);
    }
  }

  // 合并文章数据
  private mergeArticles(local: ArticleData[], cloud: ArticleData[]): ArticleData[] {
    const merged = new Map<string, ArticleData>();
    
    // 添加本地文章
    local.forEach(article => {
      merged.set(article.id, article);
    });
    
    // 添加云存储文章，如果本地没有或云存储更新
    cloud.forEach(article => {
      const localArticle = merged.get(article.id);
      if (!localArticle || this.isNewer(article, localArticle)) {
        merged.set(article.id, article);
      }
    });
    
    return Array.from(merged.values());
  }

  // 判断文章是否更新
  private isNewer(article1: ArticleData, article2: ArticleData): boolean {
    // 这里可以根据实际需求实现更复杂的比较逻辑
    return article1.title !== article2.title || 
           article1.content !== article2.content ||
           article1.fileUrl !== article2.fileUrl;
  }

  // 获取本地文章
  private getLocalArticles(): ArticleData[] {
    try {
      const stored = localStorage.getItem('learning_articles');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取本地文章失败:', error);
      return [];
    }
  }

  // 保存本地文章
  private saveLocalArticles(articles: ArticleData[]) {
    try {
      localStorage.setItem('learning_articles', JSON.stringify(articles));
    } catch (error) {
      console.error('保存本地文章失败:', error);
    }
  }

  // 重新加载数据
  private reloadData() {
    // 触发页面重新加载数据
    window.dispatchEvent(new CustomEvent('dataReload'));
  }

  // 手动同步
  public async manualSync() {
    console.log('开始手动同步...');
    await this.syncData();
  }

  // 获取同步状态
  public getSyncStatus(): SyncStatus {
    return {
      lastSync: this.lastSyncTime,
      isOnline: navigator.onLine,
      pendingChanges: this.pendingChanges.size
    };
  }

  // 标记数据变化
  public markChanged(articleId: string) {
    this.pendingChanges.add(articleId);
  }

  // 清理
  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// 创建全局实例
export const dataSyncService = new DataSyncService();

// 导出给其他模块使用
export default dataSyncService; 