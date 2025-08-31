#!/usr/bin/env node

/**
 * 修复文章同步到云数据库的问题
 * 
 * 问题原因：
 * 1. 前端文章主要存储在 localStorage 中
 * 2. CloudArticleService 虽然有同步功能，但可能没有正确调用
 * 3. 需要确保文章数据能正确保存到云数据库
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 数据库配置
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
    console.log('🔌 正在连接到云数据库...');
    console.log(`   主机: ${dbConfig.host}`);
    console.log(`   数据库: ${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 成功连接到云数据库\n');
    
    // 1. 检查 articles 表是否存在
    console.log('📋 检查 articles 表结构...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'articles'"
    );
    
    if (tables.length === 0) {
      console.log('⚠️ articles 表不存在，正在创建...');
      
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS articles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          category VARCHAR(100),
          required_reading_time INT DEFAULT 30,
          file_type VARCHAR(50) DEFAULT 'none',
          file_url TEXT,
          file_name VARCHAR(255),
          file_id VARCHAR(255),
          storage_type VARCHAR(50) DEFAULT 'local',
          status VARCHAR(50) DEFAULT 'published',
          allowed_job_types JSON,
          questions JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_status (status),
          INDEX idx_category (category),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ articles 表创建成功\n');
    } else {
      console.log('✅ articles 表已存在\n');
      
      // 检查表结构，添加缺失的字段
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM articles"
      );
      
      const columnNames = columns.map(col => col.Field);
      
      // 添加 questions 字段（如果不存在）
      if (!columnNames.includes('questions')) {
        console.log('📝 添加 questions 字段...');
        await connection.execute(
          "ALTER TABLE articles ADD COLUMN questions JSON"
        );
        console.log('✅ questions 字段添加成功');
      }
      
      // 添加 file_id 字段（如果不存在）
      if (!columnNames.includes('file_id')) {
        console.log('📝 添加 file_id 字段...');
        await connection.execute(
          "ALTER TABLE articles ADD COLUMN file_id VARCHAR(255)"
        );
        console.log('✅ file_id 字段添加成功');
      }
      
      // 添加 status 字段（如果不存在）
      if (!columnNames.includes('status')) {
        console.log('📝 添加 status 字段...');
        await connection.execute(
          "ALTER TABLE articles ADD COLUMN status VARCHAR(50) DEFAULT 'published'"
        );
        console.log('✅ status 字段添加成功');
      }
    }
    
    // 2. 查询当前文章数量
    const [countResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM articles"
    );
    console.log(`📊 当前云数据库中有 ${countResult[0].count} 篇文章\n`);
    
    // 3. 插入示例文章（如果表为空）
    if (countResult[0].count === 0) {
      console.log('📝 插入示例文章...');
      
      const sampleArticles = [
        {
          title: '安全操作规程',
          content: '这是一篇关于安全操作规程的文章。\n\n## 主要内容\n\n1. 安全注意事项\n2. 操作流程\n3. 应急处理',
          category: '安全培训',
          required_reading_time: 30,
          file_type: 'none',
          questions: JSON.stringify([
            {
              question: '安全操作的第一步是什么？',
              options: ['检查设备', '穿戴防护装备', '签到', '开始作业'],
              answer: 1,
              explanation: '穿戴防护装备是确保安全的第一步'
            }
          ])
        },
        {
          title: '设备维护手册',
          content: '本手册详细介绍了设备的日常维护方法。\n\n## 维护要点\n\n- 定期检查\n- 清洁保养\n- 故障排除',
          category: '技术文档',
          required_reading_time: 45,
          file_type: 'pdf',
          file_url: '/uploads/sample-manual.pdf',
          file_name: '设备维护手册.pdf',
          questions: JSON.stringify([
            {
              question: '设备维护的周期是？',
              options: ['每天', '每周', '每月', '每年'],
              answer: 2,
              explanation: '设备应该每月进行一次全面维护'
            }
          ])
        }
      ];
      
      for (const article of sampleArticles) {
        await connection.execute(
          `INSERT INTO articles 
           (title, content, category, required_reading_time, file_type, file_url, file_name, questions, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
          [
            article.title,
            article.content,
            article.category,
            article.required_reading_time,
            article.file_type,
            article.file_url || null,
            article.file_name || null,
            article.questions
          ]
        );
        console.log(`✅ 已插入文章: ${article.title}`);
      }
      
      console.log('\n✅ 示例文章插入完成');
    }
    
    // 4. 显示当前所有文章
    console.log('\n📚 当前云数据库中的文章：');
    const [articles] = await connection.execute(
      "SELECT id, title, category, file_type, created_at FROM articles ORDER BY created_at DESC LIMIT 10"
    );
    
    if (articles.length > 0) {
      console.table(articles.map(article => ({
        ID: article.id,
        标题: article.title,
        分类: article.category || '未分类',
        文件类型: article.file_type || 'none',
        创建时间: new Date(article.created_at).toLocaleString('zh-CN')
      })));
    } else {
      console.log('（暂无文章）');
    }
    
    // 5. 提供同步建议
    console.log('\n💡 同步建议：');
    console.log('1. 确保前端调用 addArticle 时传入 syncToCloud: true 参数');
    console.log('2. 检查前端 CloudArticleService 的 API_BASE 配置是否正确');
    console.log('3. 确保服务器正在运行并监听端口 3002');
    console.log('4. 清除浏览器缓存并重新登录');
    
    console.log('\n✅ 文章同步检查完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   请检查数据库用户名和密码是否正确');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   请检查数据库服务器是否正在运行');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   数据库不存在，请先创建数据库');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行主函数
main().catch(console.error);
