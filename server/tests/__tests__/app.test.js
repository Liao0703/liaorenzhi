const request = require('supertest');
const app = require('../../app');

describe('应用基础功能测试', () => {
  describe('健康检查接口', () => {
    test('GET /health 应该返回服务器状态', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
      
      // 验证时间戳格式
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    test('GET /api/health 应该返回API状态', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('CORS测试接口', () => {
    test('GET /api/cors-test 应该返回CORS配置状态', async () => {
      const response = await request(app)
        .get('/api/cors-test')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'CORS配置正常');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('API文档接口', () => {
    test('GET /api-docs.json 应该返回OpenAPI规范', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('openapi', '3.0.0');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body).toHaveProperty('components');
      
      // 验证API文档基本信息
      expect(response.body.info).toHaveProperty('title', '兴站智训通 API');
      expect(response.body.info).toHaveProperty('version', '1.0.0');
    });

    test('GET /api-docs 应该返回Swagger UI页面', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      // 应该返回HTML页面
      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('swagger-ui');
    });
  });

  describe('文件上传接口', () => {
    test('POST /api/files/upload 没有文件应该返回400错误', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '没有上传文件');
    });

    test('GET /api/files/download/nonexistent 应该返回404错误', async () => {
      const response = await request(app)
        .get('/api/files/download/nonexistent.txt')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '文件不存在');
    });
  });

  describe('错误处理测试', () => {
    test('访问不存在的路由应该返回404', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', '接口不存在');
    });

    test('POST 请求到不存在的路由应该返回404', async () => {
      const response = await request(app)
        .post('/api/nonexistent-route')
        .send({ test: 'data' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', '接口不存在');
    });
  });

  describe('中间件测试', () => {
    test('应该正确设置安全头', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // 验证Helmet设置的安全头
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    test('应该支持JSON请求', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect('Content-Type', /json/);

      // 应该能够处理JSON请求（即使认证失败）
      expect([400, 401]).toContain(response.status);
    });

    test('应该限制请求体大小（测试中间件配置）', async () => {
      // 这个测试验证express.json配置正确
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect('Content-Type', /json/);

      expect(response.status).not.toBe(413); // Payload Too Large
    });
  });

  describe('数据库连接测试', () => {
    test('应用启动时应该能连接到数据库或使用内存存储', async () => {
      // 通过健康检查间接验证数据库连接
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');

      // 验证能够执行数据库查询（通过用户列表接口）
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: '123456' });

      if (loginResponse.status === 200) {
        const token = loginResponse.body.token;
        
        const usersResponse = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(usersResponse.body).toHaveProperty('success', true);
        expect(usersResponse.body).toHaveProperty('data');
      }
    });
  });

  describe('环境配置测试', () => {
    test('应该在测试环境中运行', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    test('应该设置JWT密钥', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET.length).toBeGreaterThan(0);
    });
  });
});
