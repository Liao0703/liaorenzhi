// 云端文章数据同步服务
import type { ArticleData } from './articleData';
import { API_BASE_URL } from './config/api';

// 统一使用后端 API 根路径（生产为 https://api.liaorenzhi.top/api）
const API_BASE = API_BASE_URL;

export interface CloudApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

export class CloudArticleService {
  
  // 获取所有文章
  static async getAllArticles(): Promise<ArticleData[]> {
    try {
      const response = await fetch(`${API_BASE}/articles`);
      if (!response.ok) {
        throw new Error(`获取文章失败: ${response.status}`);
      }
      
      const result: CloudApiResponse<any[]> = await response.json();
      if (result.success && result.data) {
        // 转换服务器数据格式为前端格式
        return result.data.map((serverArticle: any) => ({
          id: serverArticle.id?.toString(),
          title: serverArticle.title || '未命名文章',
          content: serverArticle.content || '',
          category: serverArticle.category || '未分类',
          requiredReadingTime: serverArticle.required_reading_time || 30,
          questions: serverArticle.questions ? JSON.parse(serverArticle.questions) : [], // 解析题目数据
          fileType: serverArticle.file_type || 'none',
          fileUrl: serverArticle.file_url,
          fileName: serverArticle.file_name,
          fileId: serverArticle.file_id,
          storageType: serverArticle.storage_type || 'local',
          allowedJobTypes: serverArticle.allowed_job_types ? JSON.parse(serverArticle.allowed_job_types) : undefined
        }));
      } else {
        throw new Error(result.error || '获取文章失败');
      }
    } catch (error) {
      console.error('获取云端文章失败:', error);
      throw error;
    }
  }

  // 添加文章
  static async addArticle(article: Omit<ArticleData, 'id'>): Promise<ArticleData> {
    try {
      // 转换前端数据格式为服务器格式
      const serverArticle = {
        title: article.title,
        content: article.content,
        category: article.category,
        required_reading_time: article.requiredReadingTime || 30,
        file_type: article.fileType || 'none',
        file_url: article.fileUrl,
        file_name: article.fileName,
        file_id: article.fileId,
        storage_type: article.storageType || 'local',
        allowed_job_types: article.allowedJobTypes || null,
        questions: article.questions ? JSON.stringify(article.questions) : null
      };

      const response = await fetch(`${API_BASE}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverArticle),
      });

      if (!response.ok) {
        throw new Error(`添加文章失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        // 转换服务器数据格式为前端格式
        const serverData = result.data;
        return {
          id: serverData.id?.toString(),
          title: serverData.title,
          content: serverData.content || '',
          category: serverData.category || '未分类',
          requiredReadingTime: serverData.required_reading_time || 30,
          questions: article.questions || [], // 保留原始题目数据
          fileType: serverData.file_type || 'none',
          fileUrl: serverData.file_url,
          fileName: serverData.file_name,
          fileId: serverData.file_id,
          storageType: serverData.storage_type || 'local',
          allowedJobTypes: serverData.allowed_job_types ? JSON.parse(serverData.allowed_job_types) : undefined
        };
      } else {
        throw new Error(result.error || '添加文章失败');
      }
    } catch (error) {
      console.error('添加云端文章失败:', error);
      throw error;
    }
  }

  // 更新文章
  static async updateArticle(article: ArticleData): Promise<ArticleData> {
    try {
      // 转换前端数据格式为服务器格式
      const serverArticle = {
        title: article.title,
        content: article.content,
        category: article.category,
        required_reading_time: article.requiredReadingTime || 30,
        file_type: article.fileType || 'none',
        file_url: article.fileUrl,
        file_name: article.fileName,
        file_id: article.fileId,
        storage_type: article.storageType || 'local',
        allowed_job_types: article.allowedJobTypes || null,
        questions: article.questions ? JSON.stringify(article.questions) : null
      };

      const response = await fetch(`${API_BASE}/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverArticle),
      });

      if (!response.ok) {
        throw new Error(`更新文章失败: ${response.status}`);
      }

      const result: CloudApiResponse = await response.json();
      if (result.success) {
        return article; // 返回更新后的文章数据
      } else {
        throw new Error(result.error || '更新文章失败');
      }
    } catch (error) {
      console.error('更新云端文章失败:', error);
      throw error;
    }
  }

  // 删除文章
  static async deleteArticle(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/articles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`删除文章失败: ${response.status}`);
      }

      const result: CloudApiResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || '删除文章失败');
  }
    } catch (error) {
      console.error('删除云端文章失败:', error);
      throw error;
    }
  }

  // 同步本地文章到云端
  static async syncLocalToCloud(localArticles: ArticleData[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const article of localArticles) {
      try {
        // 尝试更新（如果存在）或添加（如果不存在）
        await fetch(`${API_BASE}/articles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(article),
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`文章"${article.title}": ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return { success, failed, errors };
  }

  // 检查云端连接状态
  static async checkCloudStatus(): Promise<{
    connected: boolean;
    articlesCount: number;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/articles`);
      if (!response.ok) {
        throw new Error(`连接失败: ${response.status}`);
      }

      const result: CloudApiResponse<ArticleData[]> = await response.json();
      if (result.success) {
        return {
          connected: true,
          articlesCount: result.data?.length || 0,
          message: '云端连接正常'
        };
      } else {
        throw new Error(result.error || '云端服务异常');
      }
    } catch (error) {
      return {
        connected: false,
        articlesCount: 0,
        message: error instanceof Error ? error.message : '连接失败'
      };
    }
  }

  // 强制同步：从云端获取最新数据并更新本地
  static async forceSync(): Promise<{
    success: boolean;
    articlesCount: number;
    message: string;
  }> {
    try {
      const cloudArticles = await this.getAllArticles();
      
      // 更新本地存储
      localStorage.setItem('learning_articles', JSON.stringify(cloudArticles));
      
      return {
        success: true,
        articlesCount: cloudArticles.length,
        message: `同步成功，获取到 ${cloudArticles.length} 篇文章`
      };
    } catch (error) {
      return {
        success: false,
        articlesCount: 0,
        message: error instanceof Error ? error.message : '同步失败'
      };
    }
  }
}

// 便捷函数导出
export const {
  getAllArticles: getCloudArticles,
  addArticle: addCloudArticle,
  updateArticle: updateCloudArticle,
  deleteArticle: deleteCloudArticle,
  syncLocalToCloud,
  checkCloudStatus,
  forceSync
} = CloudArticleService;
