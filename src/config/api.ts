// API配置 - 智能环境检测（支持Node.js和PHP后端）
const getApiBaseUrl = () => {
  // 1) 允许通过构建环境变量覆盖
  //    例如：VITE_API_BASE_URL=/api 或 http://192.168.1.10/api
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL
    || (typeof process !== 'undefined' && (process as any)?.env?.VITE_API_BASE_URL)
    || '/api';
  if (envUrl) {
    return String(envUrl).replace(/\/$/, '');
  }

  const { hostname } = window.location;

  // 2) 云服务器或生产环境 - PHP后端
  if (
    hostname === '47.109.142.72' ||
    hostname === '116.62.65.246' ||
    hostname === 'www.liaorenzhi.top' ||
    hostname === 'liaorenzhi.top' ||
    hostname.includes('vercel.app') ||
    !hostname.includes('localhost')
  ) {
    // 生产环境使用同域API（PHP后端）
    return '/api';
  }

  // 3) 本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 本地开发优先走同域代理 /api（由 vite proxy 指向后端）
    return '/api';
  }

  // 4) 默认：生产环境PHP后端
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// API客户端
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 获取本地存储的token
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // 添加超时控制
      signal: AbortSignal.timeout(10000), // 增加到10秒超时
    };

    try {
      console.log(`API请求: ${url}`, config);
      const response = await fetch(url, config);
      
      console.log(`API响应: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`API请求失败: ${response.status} ${response.statusText}`, errorText);
        const friendly = response.status === 401 ? '账号或密码错误' : `HTTP错误: ${response.status} ${response.statusText}`;
        return { 
          success: false, 
          error: friendly,
          statusCode: response.status
        };
      }
      
      const data = await response.json();
      console.log('API响应数据:', data);
      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      // 网络层失败时，尝试备用基址（本地开发常见3000/3001切换或同域 /api 代理）
      const fallbacks: string[] = [];
      if (this.baseURL.includes('localhost:3000')) fallbacks.push('http://localhost:3001/api');
      if (this.baseURL.includes('localhost:3001')) fallbacks.push('http://localhost:3000/api');
      // 同域反向代理（若已配置）
      if (!this.baseURL.startsWith('/')) fallbacks.push('/api');

      for (const fb of fallbacks) {
        try {
          const fbUrl = `${fb}${endpoint}`;
          console.warn(`重试备用API地址: ${fbUrl}`);
          const response = await fetch(fbUrl, config);
          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`备用API请求失败: ${response.status} ${response.statusText}`, errorText);
            continue;
          }
          const data = await response.json();
          console.log('备用API响应数据:', data);
          return data;
        } catch (_) {
          // 忽略，尝试下一个
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败',
        isNetworkError: true
      };
    }
  }

  // GET请求
  async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST请求
  async post(endpoint: string, data: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT请求
  async put(endpoint: string, data: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE请求
  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient(API_BASE_URL);

// 认证相关API
export const authAPI = {
  // 登录
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),

  // 获取当前用户信息
  getCurrentUser: () =>
    apiClient.get('/auth/me'),

  // 注册（如需要）
  register: (userData: any) =>
    apiClient.post('/auth/register', userData),
};

// 用户相关API
export const userAPI = {
  // 获取所有用户
  getAll: () =>
    apiClient.get('/users'),

  // 获取单个用户
  getById: (id: string) =>
    apiClient.get(`/users/${id}`),

  // 创建用户
  create: (userData: any) =>
    apiClient.post('/users', userData),

  // 更新用户
  update: (id: string, userData: any) =>
    apiClient.put(`/users/${id}`, userData),

  // 删除用户
  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
  
  // 当前用户更新资料（头像/昵称/邮箱/手机）
  updateMe: (data: any) =>
    apiClient.put('/users/me', data),

  // 修改密码
  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.post('/users/me/change-password', { oldPassword, newPassword }),

  // 邮箱两步验证：发送验证码
  sendEmail2FACode: () =>
    apiClient.post('/users/me/2fa/email/send', {}),

  // 邮箱两步验证：开启
  enableEmail2FA: (code: string) =>
    apiClient.post('/users/me/2fa/email/enable', { code }),

  // 邮箱两步验证：关闭
  disableEmail2FA: (code: string) =>
    apiClient.post('/users/me/2fa/email/disable', { code }),
};

// 学习记录相关API
export const learningRecordAPI = {
  // 获取所有学习记录
  getAll: () =>
    apiClient.get('/learning-records'),

  // 获取用户学习记录
  getByUserId: (userId: string) =>
    apiClient.get(`/learning-records/user/${userId}`),

  // 获取文章学习记录
  getByArticleId: (articleId: string) =>
    apiClient.get(`/learning-records/article/${articleId}`),

  // 创建学习记录
  create: (recordData: any) =>
    apiClient.post('/learning-records', recordData),

  // 更新学习记录
  update: (id: string, recordData: any) =>
    apiClient.put(`/learning-records/${id}`, recordData),

  // 删除学习记录
  delete: (id: string) =>
    apiClient.delete(`/learning-records/${id}`),

  // 获取学习统计
  getStats: () =>
    apiClient.get('/learning-records/stats'),

  // 获取文章学习统计
  getArticleStats: (articleId: string) =>
    apiClient.get(`/learning-records/article/${articleId}/stats`),

  // 导出学习记录
  export: (filters?: any) =>
    apiClient.post('/learning-records/export', filters),

  // 获取学习排行榜
  getLeaderboard: (limit?: number) =>
    apiClient.get(`/learning-records/leaderboard${limit ? `?limit=${limit}` : ''}`),

  // 获取用户排名详情
  getUserRank: (userId: string) =>
    apiClient.get(`/learning-records/user/${userId}/rank`),

  // 获取学习统计概览
  getOverviewStats: () =>
    apiClient.get('/learning-records/statistics/overview'),
};

// 文章相关API
export const articleAPI = {
  // 获取所有文章
  getAll: () =>
    apiClient.get('/articles'),

  // 获取单个文章
  getById: (id: string) =>
    apiClient.get(`/articles/${id}`),

  // 创建文章
  create: (articleData: any) =>
    apiClient.post('/articles', articleData),

  // 更新文章
  update: (id: string, articleData: any) =>
    apiClient.put(`/articles/${id}`, articleData),

  // 删除文章
  delete: (id: string) =>
    apiClient.delete(`/articles/${id}`),
};

// 照片相关API（云数据库）
export const photoAPI = {
  // 列表（支持分页与搜索）
  list: (params?: { page?: number; limit?: number; q?: string; start?: string; end?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.q) sp.set('q', params.q);
    if (params?.start) sp.set('start', params.start);
    if (params?.end) sp.set('end', params.end);
    const qs = sp.toString();
    return apiClient.get(`/photos${qs ? `?${qs}` : ''}`);
  },
  // 根据用户/文章筛选
  listByUser: (userId: number | string) => apiClient.get(`/photos/user/${userId}`),
  listByArticle: (articleId: number | string) => apiClient.get(`/photos/article/${articleId}`),
  // 新建
  create: (data: { user_id: number; article_id: number; photo_data: string; file_name?: string; file_size?: number; }) =>
    apiClient.post('/photos', data),
  // 删除
  delete: (id: number | string) => apiClient.delete(`/photos/${id}`),
  // 导出CSV
  exportCsv: (params?: { q?: string; start?: string; end?: string }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.start) sp.set('start', params.start);
    if (params?.end) sp.set('end', params.end);
    const qs = sp.toString();
    const url = `${API_BASE_URL}/photos/export${qs ? `?${qs}` : ''}`;
    return fetch(url, { method: 'GET' });
  }
};

export default apiClient;