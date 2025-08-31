#!/usr/bin/env node
/**
 * 用户注册功能测试脚本
 */
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

const testUser = {
  username: 'testuser_' + Date.now(),
  password: '123456',
  name: '测试用户',
  role: 'user',
  email: 'test@example.com',
  phone: '13800138888',
  department: '测试部门'
};

async function testRegistration() {
  try {
    console.log('🧪 开始测试用户注册功能...');
    console.log('测试数据:', testUser);
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    
    console.log('✅ 注册成功！');
    console.log('响应:', response.data);
    
    // 测试登录功能
    console.log('\n🧪 测试登录功能...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    
    console.log('✅ 登录成功！');
    console.log('登录响应:', loginResponse.data);
    
    console.log('\n🎉 所有测试通过！用户账号已成功存储在数据库中。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.status === 409) {
      console.log('用户名已存在，这是正常的。');
    }
  }
}

// 运行测试
testRegistration();
