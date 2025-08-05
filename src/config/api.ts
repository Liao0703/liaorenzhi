// API配置 - 智能环境检测
const getApiBaseUrl = () => {
  // 如果是云服务器环境（通过hostname检测）
  if (window.location.hostname === '116.62.65.246') {
    // 云服务器环境，使用云服务器API
    return 'http://116.62.65.246:3001/api';
  }
  // 本地开发环境
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

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
      signal: AbortSignal.timeout(5000), // 5秒超时
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        console.warn(`API请求失败: ${response.status} ${response.statusText}`);
        return { 
          success: false, 
          error: `HTTP错误: ${response.status} ${response.statusText}`,
          statusCode: response.status
        };
      }
      return await response.json();
    } catch (error) {
      console.error('API请求失败:', error);
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

  // 导出学习记录
  export: (filters?: any) =>
    apiClient.post('/learning-records/export', filters),
};

export default apiClient;