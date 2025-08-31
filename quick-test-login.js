#!/usr/bin/env node

// 快速测试登录API的脚本
const http = require('http');

const testLogin = (host, port, path) => {
  const data = JSON.stringify({
    username: 'admin',
    password: '123456'
  });

  const options = {
    hostname: host,
    port: port,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    },
    timeout: 10000
  };

  console.log(`🧪 测试登录API: http://${host}:${port}${path}`);
  
  const req = http.request(options, (res) => {
    let body = '';
    
    console.log(`📊 响应状态: ${res.statusCode}`);
    console.log(`📋 响应头:`, res.headers);
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 响应内容:`, body);
      
      if (res.statusCode === 200) {
        console.log('✅ 登录API工作正常');
      } else if (res.statusCode === 500) {
        console.log('❌ 500错误 - 服务器内部错误');
        console.log('🔧 建议检查服务器日志');
      } else {
        console.log(`⚠️ 非预期状态码: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ 请求失败:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('💡 建议：检查服务器是否正在运行');
    } else if (err.code === 'ETIMEDOUT') {
      console.log('💡 建议：检查网络连接和防火墙设置');
    }
  });

  req.on('timeout', () => {
    console.log('⏰ 请求超时');
    req.destroy();
  });

  req.write(data);
  req.end();
};

// 测试不同的端口配置
console.log('🚀 开始测试登录API...\n');

// 测试80端口（nginx代理）
testLogin('47.109.142.72', 80, '/api/auth/login');

setTimeout(() => {
  console.log('\n---\n');
  // 测试3000端口（直接访问）
  testLogin('47.109.142.72', 3000, '/api/auth/login');
}, 2000);

setTimeout(() => {
  console.log('\n---\n');
  // 测试3001端口（PM2配置）
  testLogin('47.109.142.72', 3001, '/api/auth/login');
}, 4000);



