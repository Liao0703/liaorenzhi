const request = require('supertest');
const app = require('../../../app');

describe('用户管理API测试', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    // 获取普通用户token
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: '123456'
      });
    userToken = userLogin.body.token;

    // 获取管理员token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testadmin',
        password: '123456'
      });
    adminToken = adminLogin.body.token;
  });

  describe('GET /api/users', () => {
    test('管理员应该能获取用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // 验证用户数据结构
      const user = response.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
      expect(user).not.toHaveProperty('password'); // 不应该返回密码
    });

    test('普通用户也应该能获取用户列表（当前没有权限限制）', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('未认证用户不应该能获取用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id', () => {
    test('管理员应该能获取指定用户信息', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('获取不存在的用户应该返回404错误', async () => {
      const response = await request(app)
        .get('/api/users/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', '用户不存在');
    });

    test('无效的用户ID应该返回404错误', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users', () => {
    test('管理员应该能创建新用户', async () => {
      const newUser = {
        username: 'newuser123',
        password: 'newpass123',
        name: '新测试用户',
        full_name: '新测试用户',
        role: 'user',
        employee_id: 'NEW001',
        company: '测试公司',
        department: '测试部门',
        team: '测试班组',
        job_type: '测试工种',
        email: 'newuser123@example.com',
        phone: '13800138123'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '用户创建成功');
      expect(response.body).toHaveProperty('userId');
    });

    test('创建重复用户名应该返回409错误', async () => {
      const duplicateUser = {
        username: 'testuser', // 已存在的用户名
        password: 'newpass123',
        name: '重复用户',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUser)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('error', '用户名已存在');
    });

    test('缺少必需字段应该返回400错误', async () => {
      const incompleteUser = {
        username: 'incompleteuser'
        // 缺少密码、姓名等必需字段
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', '输入验证失败');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('管理员应该能更新用户信息', async () => {
      const updateData = {
        name: '更新后的名称',
        full_name: '更新后的全名',
        email: 'updated@example.com',
        phone: '13900139000',
        company: '更新后的公司',
        department: '更新后的部门',
        team: '更新后的班组',
        job_type: '更新后的工种',
        employee_id: 'UPDATED001'
      };

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '用户信息更新成功');
    });

    test('更新不存在的用户应该返回404错误', async () => {
      const updateData = {
        name: '更新名称'
      };

      const response = await request(app)
        .put('/api/users/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', '用户不存在');
    });

    test('包含密码的更新应该正常处理', async () => {
      const updateData = {
        name: '测试名称',
        password: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('管理员应该能删除用户', async () => {
      // 先创建一个用户用于删除测试
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'deletetest',
          password: 'deletepass123',
          name: '待删除用户',
          role: 'user'
        });

      const userId = createResponse.body.userId;

      // 删除用户
      const deleteResponse = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('success', true);
      expect(deleteResponse.body).toHaveProperty('message', '用户删除成功');
    });

    test('删除不存在的用户应该返回404错误', async () => {
      const response = await request(app)
        .delete('/api/users/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', '用户不存在');
    });
  });

  describe('用户权限测试', () => {
    test('普通用户应该能执行基本操作（当前权限设置）', async () => {
      // 测试普通用户访问用户列表
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('无效token应该被拒绝', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
