import { API_BASE_URL } from '../config/api';

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalArticles: number;
  averageCompletionRate: number;
  totalStudyTime: number;
  averageScore: number;
}

interface RecentActivity {
  userName: string;
  articleTitle: string;
  actionType: 'started' | 'completed';
  time: string;
}

interface LeaderboardUser {
  name: string;
  username: string;
  department: string;
  jobType: string;
  completedArticles: number;
  totalStudyHours: number;
  averageScore: number;
}

interface OverviewData {
  stats: OverviewStats;
  recentActivities: RecentActivity[];
  leaderboard: LeaderboardUser[];
}

interface DepartmentStats {
  department: string;
  userCount: number;
  completedArticles: number;
  averageScore: number;
}

interface JobTypeStats {
  job_type: string;
  userCount: number;
  completedArticles: number;
  averageScore: number;
}

interface TrendData {
  date: string;
  activeUsers: number;
  learningCount: number;
  completedCount: number;
}

class StatisticsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // 获取管理员概览数据
  async getOverviewStats(): Promise<OverviewData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics/overview`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取统计数据失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取概览统计失败:', error);
      // 返回默认数据，避免界面崩溃
      return {
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalArticles: 0,
          averageCompletionRate: 0,
          totalStudyTime: 0,
          averageScore: 0
        },
        recentActivities: [],
        leaderboard: []
      };
    }
  }

  // 获取部门统计
  async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics/departments`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取部门统计失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取部门统计失败');
      }
    } catch (error) {
      console.error('获取部门统计失败:', error);
      return [];
    }
  }

  // 获取工种统计
  async getJobTypeStats(): Promise<JobTypeStats[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics/job-types`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取工种统计失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取工种统计失败');
      }
    } catch (error) {
      console.error('获取工种统计失败:', error);
      return [];
    }
  }

  // 获取学习趋势
  async getTrends(): Promise<TrendData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics/trends`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取学习趋势失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取学习趋势失败');
      }
    } catch (error) {
      console.error('获取学习趋势失败:', error);
      return [];
    }
  }

  // 格式化时间
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // 格式化动作类型
  formatActionType(actionType: string): string {
    const actionMap: { [key: string]: string } = {
      'started': '开始学习',
      'completed': '完成了',
      'tested': '完成测试'
    };
    return actionMap[actionType] || actionType;
  }
}

export const statisticsService = new StatisticsService();
export type { OverviewData, RecentActivity, LeaderboardUser, DepartmentStats, JobTypeStats, TrendData };




