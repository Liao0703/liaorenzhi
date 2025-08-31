module.exports = {
  // 测试环境配置
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // 覆盖率报告配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 覆盖率收集文件
  collectCoverageFrom: [
    'routes/**/*.js',
    'config/**/*.js',
    'app.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],
  
  // 覆盖率阈值（确保测试质量）
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 设置测试环境变量
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 清理模块缓存
  clearMocks: true,
  
  // 显示详细输出
  verbose: true
};
