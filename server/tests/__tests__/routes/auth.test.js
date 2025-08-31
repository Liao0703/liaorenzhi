const request = require('supertest');
const app = require('../../../app');

describe('认证API测试', () => {
  describe('POST /api/auth/login', () => {
    test('使用正确的用户名密码应该登录成功', async () => {
      const loginData = {
        username: 'testuser',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '登录成功');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      
      // 验证用户信息
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('role', 'user');
      expect(response.body.user).not.toHaveProperty('password'); // 密码不应该返回
      
      // 验证JWT token格式
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/);
    });

    test('使用错误的用户名应该返回401错误', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', '用户名或密码错误');
      expect(response.body).not.toHaveProperty('token');
    });

    test('使用错误的密码应该返回401错误', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', '用户名或密码错误');
      expect(response.body).not.toHaveProperty('token');
    });

    test('缺少用户名参数应该返回400错误', async () => {
      const loginData = {
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', '输入验证失败');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    test('缺少密码参数应该返回400错误', async () => {
      const loginData = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', '输入验证失败');
      expect(response.body).toHaveProperty('details');
    });

    test('空请求体应该返回400错误', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', '输入验证失败');
    });

    test('管理员用户登录应该成功', async () => {
      const loginData = {
        username: 'testadmin',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).toHaveProperty('username', 'testadmin');
    });
  });

  describe('POST /api/auth/register', () => {
    test('使用有效数据应该注册成功', async () => {
      const registerData = {
        username: 'newuser',
        password: 'newpass123',
        name: '新用户',
        role: 'user',
        email: 'newuser@example.com',
        phone: '13800138001',
        department: '测试部门'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '用户注册成功');
      expect(response.body).toHaveProperty('userId');
      expect(typeof response.body.userId).toBe('number');
    });

    test('重复的用户名应该返回409错误', async () => {
      const registerData = {
        username: 'testuser', // 已存在的用户名
        password: 'newpass123',
        name: '重复用户',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('error', '用户名已存在');
    });

    test('用户名太短应该返回400错误', async () => {
      const registerData = {
        username: 'ab', // 少于3个字符
        password: 'newpass123',
        name: '新用户',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', '输入验证失败');
    });

    test('密码太短应该返回400错误', async () => {
      const registerData = {
        username: 'newuser2',
        password: '123', // 少于6个字符
        name: '新用户',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', '输入验证失败');
    });

    test('无效的角色应该返回400错误', async () => {
      const registerData = {
        username: 'newuser3',
        password: 'newpass123',
        name: '新用户',
        role: 'invalidrole' // 无效角色
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', '输入验证失败');
    });
  });

  describe('身份认证中间件测试', () => {
    let validToken;

    beforeAll(async () => {
      // 先登录获取有效token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: '123456'
        });
      
      validToken = loginResponse.body.token;
    });

    test('有效token应该通过认证', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${validToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('无token应该返回401错误', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('无效token应该返回401错误', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('错误格式的Authorization头应该返回401错误', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'InvalidFormat token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
