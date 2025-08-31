// Jest测试环境设置
const path = require('path');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'learning_platform_test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';

// 禁用console.log以保持测试输出清洁（仅在需要时）
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// 全局测试工具函数
global.testUtils = {
  // 生成测试用户数据
  generateTestUser: (overrides = {}) => ({
    username: 'testuser',
    password: 'testpass123',
    name: '测试用户',
    full_name: '测试用户',
    role: 'user',
    employee_id: 'TEST001',
    company: '测试公司',
    department: '测试部门', 
    team: '测试班组',
    job_type: '测试工种',
    email: 'test@example.com',
    phone: '13800138000',
    ...overrides
  }),
  
  // 生成测试管理员数据
  generateTestAdmin: (overrides = {}) => ({
    username: 'testadmin',
    password: 'adminpass123',
    name: '测试管理员',
    full_name: '测试管理员',
    role: 'admin',
    employee_id: 'ADMIN001',
    company: '测试公司',
    department: '测试部门',
    team: '管理班组',
    job_type: '管理员',
    email: 'admin@example.com',
    phone: '13900139000',
    ...overrides
  }),
  
  // 清理测试数据
  cleanTestData: async () => {
    // 这里可以添加清理测试数据库的逻辑
    if (global.memoryDB) {
      global.memoryDB.users = [];
    }
  }
};

// 测试钩子
beforeAll(async () => {
  // 全局测试前的设置
  console.log('🧪 开始运行测试套件...');
});

afterAll(async () => {
  // 全局测试后的清理
  console.log('✅ 测试套件运行完成');
});

// 每个测试前的设置
beforeEach(async () => {
  // 重置内存数据库（如果使用）
  if (global.memoryDB) {
    global.memoryDB.users = [
      // 重置为初始测试数据
      {
        id: 1,
        username: 'testuser',
        password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
        name: '测试用户',
        full_name: '测试用户',
        role: 'user',
        email: 'test@example.com',
        phone: '13800138000',
        employee_id: 'TEST001',
        company: '测试公司',
        department: '测试部门',
        team: '测试班组',
        job_type: '测试工种',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        username: 'testadmin',
        password: '$2a$10$av/uDQ46.OvGNnaF1cKPyeQyaOFKdfQkj0mfiYcWNt2yq7g68lRI6', // 123456
        name: '测试管理员',
        full_name: '测试管理员',
        role: 'admin',
        email: 'admin@example.com',
        phone: '13900139000',
        employee_id: 'ADMIN001',
        company: '测试公司',
        department: '测试部门',
        team: '管理班组',
        job_type: '管理员',
        created_at: new Date().toISOString()
      }
    ];
  }
});

// 每个测试后的清理
afterEach(async () => {
  // 清理操作
  jest.clearAllMocks();
});
