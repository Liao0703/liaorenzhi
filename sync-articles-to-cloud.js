#!/usr/bin/env node

/**
 * 同步文章到云数据库
 * 确保articles表结构正确并插入示例数据
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'learning_platform',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function main() {
  let connection;
  
  try {
    console.log('🔌 连接到云数据库...');
    console.log(`   主机: ${dbConfig.host}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');
    
    // 1. 删除旧表（如果存在）并重新创建
    console.log('📋 重建 articles 表...');
    
    await connection.execute("DROP TABLE IF EXISTS articles");
    
    await connection.execute(`
      CREATE TABLE articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL COMMENT '文章标题',
        content TEXT COMMENT '文章内容',
        category VARCHAR(100) COMMENT '分类',
        required_reading_time INT DEFAULT 30 COMMENT '要求阅读时间(秒)',
        file_type VARCHAR(50) DEFAULT 'none' COMMENT '文件类型',
        file_url TEXT COMMENT '文件URL',
        file_name VARCHAR(255) COMMENT '文件名',
        file_id VARCHAR(255) COMMENT '文件ID',
        storage_type VARCHAR(50) DEFAULT 'local' COMMENT '存储类型',
        status VARCHAR(50) DEFAULT 'published' COMMENT '状态',
        allowed_job_types JSON COMMENT '允许的工种',
        questions JSON COMMENT '题目',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_category (category),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表'
    `);
    
    console.log('✅ articles 表创建成功\n');
    
    // 2. 插入示例文章
    console.log('📝 插入示例文章...');
    
    const articles = [
      {
        title: '兴隆场车站安全操作规程',
        content: `# 兴隆场车站安全操作规程

## 一、总则
1. 本规程适用于兴隆场车站所有工作人员
2. 所有人员必须严格遵守安全操作规程
3. 违反规程将按照相关制度进行处罚

## 二、安全要求
1. 进入作业区必须穿戴防护装备
2. 作业前必须进行安全检查
3. 发现安全隐患必须立即上报

## 三、操作流程
1. 班前准备
2. 安全检查
3. 正常作业
4. 交接班

## 四、应急处理
如遇突发情况，应立即：
1. 停止作业
2. 报告班组长
3. 采取应急措施
4. 等待进一步指示`,
        category: '安全规程',
        required_reading_time: 300,
        file_type: 'none',
        questions: [
          {
            question: '进入作业区前必须做什么？',
            options: ['签到', '穿戴防护装备', '喝水', '休息'],
            answer: 1,
            explanation: '安全第一，必须穿戴防护装备'
          },
          {
            question: '发现安全隐患应该怎么做？',
            options: ['忽略', '自己处理', '立即上报', '等下班再说'],
            answer: 2,
            explanation: '发现安全隐患必须立即上报'
          }
        ]
      },
      {
        title: '白市驿车站设备维护手册',
        content: `# 白市驿车站设备维护手册

## 设备清单
- 信号设备
- 道岔设备
- 通信设备
- 照明设备

## 日常维护
### 每日检查
- 设备运行状态
- 异常声音
- 温度检测

### 每周维护
- 清洁保养
- 紧固检查
- 润滑保养

### 每月维护
- 全面检查
- 性能测试
- 更换易损件

## 故障处理
1. 记录故障现象
2. 初步判断原因
3. 按照手册处理
4. 无法处理时上报`,
        category: '技术文档',
        required_reading_time: 600,
        file_type: 'pdf',
        file_url: '/uploads/maintenance-manual.pdf',
        file_name: '设备维护手册.pdf',
        questions: [
          {
            question: '设备维护的周期包括哪些？',
            options: ['仅每日', '每日、每周', '每日、每周、每月', '仅每月'],
            answer: 2,
            explanation: '设备维护包括每日、每周、每月三个周期'
          }
        ]
      },
      {
        title: '运转班组作业标准',
        content: `# 运转班组作业标准

## 班前准备
1. 提前15分钟到岗
2. 参加班前会
3. 接受任务分配
4. 检查工具设备

## 作业标准
1. 严格执行作业程序
2. 保持作业区域整洁
3. 及时记录作业情况
4. 发现问题及时处理

## 交接班要求
1. 清点工具设备
2. 填写交接班记录
3. 交代注意事项
4. 确认签字`,
        category: '作业标准',
        required_reading_time: 240,
        file_type: 'none',
        allowed_job_types: ['车站值班员', '助理值班员'],
        questions: [
          {
            question: '班前需要提前多少分钟到岗？',
            options: ['5分钟', '10分钟', '15分钟', '20分钟'],
            answer: 2,
            explanation: '按照规定需要提前15分钟到岗'
          }
        ]
      }
    ];
    
    for (const article of articles) {
      const [result] = await connection.execute(
        `INSERT INTO articles 
         (title, content, category, required_reading_time, file_type, file_url, file_name, 
          allowed_job_types, questions, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
        [
          article.title,
          article.content,
          article.category,
          article.required_reading_time,
          article.file_type,
          article.file_url || null,
          article.file_name || null,
          article.allowed_job_types ? JSON.stringify(article.allowed_job_types) : null,
          article.questions ? JSON.stringify(article.questions) : null
        ]
      );
      console.log(`✅ 已插入文章: ${article.title} (ID: ${result.insertId})`);
    }
    
    // 3. 显示文章列表
    console.log('\n📚 云数据库中的文章：');
    const [articleList] = await connection.execute(
      "SELECT id, title, category, file_type, required_reading_time, created_at FROM articles"
    );
    
    console.table(articleList.map(a => ({
      ID: a.id,
      标题: a.title,
      分类: a.category,
      文件类型: a.file_type,
      阅读时间: `${a.required_reading_time}秒`,
      创建时间: new Date(a.created_at).toLocaleString('zh-CN')
    })));
    
    // 4. 测试API访问
    console.log('\n🔍 测试API访问...');
    try {
      const response = await fetch('http://localhost:3002/api/articles');
      const data = await response.json();
      console.log(`✅ API返回 ${data.data?.length || 0} 篇文章`);
    } catch (error) {
      console.log('⚠️ API访问失败，请确保服务器正在运行');
    }
    
    console.log('\n✅ 文章同步完成！');
    console.log('\n💡 下一步操作：');
    console.log('1. 在管理员面板中上传新文章时，确保调用了云端同步功能');
    console.log('2. 检查前端 src/cloudDataService.ts 中的 API_BASE 是否正确');
    console.log('3. 确保前端 addArticle 和 updateArticle 函数使用了 syncToCloud 参数');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('   详细信息:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

main().catch(console.error);
