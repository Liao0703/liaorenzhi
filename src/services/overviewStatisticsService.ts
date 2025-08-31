import { API_BASE_URL, apiClient } from '../config/api';

// 定义统计数据类型
export interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalArticles: number;
  averageCompletionRate: number;
  totalStudyTime: number;
  averageScore: number;
}

export interface RecentActivity {
  id: number;
  userName: string;
  department: string;
  activityType: string;
  articleTitle?: string;
  description: string;
  activityTime: string;
  timeAgo: string;
}

export interface LeaderboardUser {
  userId: number;
  userName: string;
  department: string;
  jobType: string;
  completedCount: number;
  studyHours: number;
  averageScore: number;
  activeDays: number;
  medal?: string;
  rank: number;
}

export interface DepartmentStat {
  department: string;
  userCount: number;
  activeUserCount: number;
  avgStudyTime: number;
  avgScore: number;
  completionRate: number;
}

export interface JobTypeStat {
  jobType: string;
  userCount: number;
  activeUserCount: number;
  avgStudyTime: number;
  avgScore: number;
  completionRate: number;
}

export interface LearningTrend {
  date: string;
  activeUsers: number;
  learningCount: number;
  completedCount: number;
  totalHours: number;
}

export interface ArticleStat {
  id: number;
  title: string;
  category: string;
  learnersCount: number;
  completionRate: number;
  avgStudyTime: number;
  avgScore: number;
}

export interface OverviewData {
  stats: OverviewStats;
  recentActivities: RecentActivity[];
  leaderboard: LeaderboardUser[];
  departmentStats: DepartmentStat[];
  jobTypeStats: JobTypeStat[];
  learningTrend: LearningTrend[];
  articleStats: ArticleStat[];
}

export interface RealtimeStats {
  totalUsers: number;
  onlineUsers: number;
  recentLearnings: number;
  recentCompletions: number;
}

export interface PagedActivities {
  items: RecentActivity[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

class OverviewStatisticsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // 获取管理员概览统计数据
  async getOverviewStats(): Promise<OverviewData> {
    try {
      const data = await apiClient.get('/overview-statistics/overview');
      if (data?.success) return data.data as OverviewData;
      throw new Error(data?.error || '获取统计数据失败');
    } catch (error) {
      console.error('获取概览统计失败:', error);
      throw error;
    }
  }

  // 获取实时统计数据
  async getRealtimeStats(): Promise<RealtimeStats> {
    try {
      const data = await apiClient.get('/overview-statistics/realtime');
      if (data?.success) return data.data as RealtimeStats;
      throw new Error(data?.error || '获取实时数据失败');
    } catch (error) {
      console.error('获取实时统计失败:', error);
      throw error;
    }
  }

  // 分页获取最近活动
  async getRecentActivities(page = 1, limit = 10): Promise<PagedActivities> {
    const data = await apiClient.get(`/overview-statistics/activities?page=${page}&limit=${limit}`);
    if (!data?.success) throw new Error(data?.error || '获取最近活动失败');
    return data.data as PagedActivities;
  }

  // 刷新统计数据
  async refreshStats(): Promise<boolean> {
    try {
      const data = await apiClient.post('/overview-statistics/refresh', {});
      return !!data?.success;
    } catch (error) {
      console.error('刷新统计失败:', error);
      return false;
    }
  }

  // 获取部门详细统计
  async getDepartmentDetail(department: string): Promise<any[]> {
    try {
      const data = await apiClient.get(`/overview-statistics/departments/${encodeURIComponent(department)}`);
      if (data?.success) return data.data as any[];
      throw new Error(data?.error || '获取部门详情失败');
    } catch (error) {
      console.error('获取部门详情失败:', error);
      throw error;
    }
  }

  // 获取工种详细统计
  async getJobTypeDetail(jobType: string): Promise<any[]> {
    try {
      const data = await apiClient.get(`/overview-statistics/job-types/${encodeURIComponent(jobType)}`);
      if (data?.success) return data.data as any[];
      throw new Error(data?.error || '获取工种详情失败');
    } catch (error) {
      console.error('获取工种详情失败:', error);
      throw error;
    }
  }

  // 获取用户学习总览
  async getUsersOverview(filters?: { unit?: string; department?: string; team?: string; jobType?: string; }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.unit) params.set('unit', filters.unit);
    if (filters?.department) params.set('department', filters.department);
    if (filters?.team) params.set('team', filters.team);
    if (filters?.jobType) params.set('jobType', filters.jobType);
    const qs = params.toString();

    const data = await apiClient.get(`/overview-statistics/users-overview${qs ? `?${qs}` : ''}`);
    if (data?.success) return data.data;
    throw new Error(data?.error || '获取用户学习总览失败');
  }

  // 导出统计数据
  async exportStats(type: 'overview' | 'users' | 'departments' | 'jobtypes', format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      if (format === 'csv') {
        const url = `${API_BASE_URL}/overview-statistics/export?type=${type}&format=${format}`;
        const response = await fetch(url, { method: 'GET', headers: this.getAuthHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const dl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dl;
        a.download = `statistics_${type}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(dl);
      } else {
        const data = await apiClient.get(`/overview-statistics/export?type=${type}&format=${format}`);
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const dl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dl;
        a.download = `statistics_${type}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(dl);
      }
    } catch (error) {
      console.error('导出统计失败:', error);
      throw error;
    }
  }

  // 格式化时间差
  formatTimeAgo(date: string | Date): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return activityDate.toLocaleDateString('zh-CN');
  }

  // 格式化学习时长
  formatStudyTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  }

  // 格式化精确日期时间：YYYY-MM-DD HH:mm:ss
  formatDateTime(date: string | Date): string {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  }
}

// 导出服务实例
export const overviewStatisticsService = new OverviewStatisticsService();
