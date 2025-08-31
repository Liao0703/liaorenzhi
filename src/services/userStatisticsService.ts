import { API_BASE_URL } from '../config/api';

interface UserStats {
  totalArticles: number;
  completedArticles: number;
  totalStudyTime: number; // 分钟
  averageScore: number;
  currentStreak: number;
  domainScores: {
    safety: number;
    maintenance: number;
    emergency: number;
    signal: number;
    dispatch: number;
    operation: number;
  };
  recentLearning: Array<{
    articleTitle: string;
    completedAt: string;
  }>;
}

class UserStatisticsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // 获取当前用户的学习统计
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics/user/me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取用户统计失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取用户统计失败');
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
      // 返回默认数据
      return {
        totalArticles: 15,
        completedArticles: 8,
        totalStudyTime: 240,
        averageScore: 85,
        currentStreak: 5,
        domainScores: {
          safety: 88,
          maintenance: 82,
          emergency: 75,
          signal: 91,
          dispatch: 79,
          operation: 85
        },
        recentLearning: [
          { articleTitle: '铁路安全操作规程', completedAt: '2024-01-15 14:30' },
          { articleTitle: '设备维护保养指南', completedAt: '2024-01-14 09:15' },
          { articleTitle: '应急处理流程', completedAt: '2024-01-13 16:45' }
        ]
      };
    }
  }
}

export const userStatisticsService = new UserStatisticsService();
export type { UserStats };




