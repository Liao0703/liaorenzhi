const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// 获取管理员概览统计数据
router.get('/overview', async (req, res) => {
  try {
    // 获取总用户数
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN last_login_time > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as activeUsers
      FROM users
      WHERE role = 'user'
    `);

    // 获取文章总数和平均完成率
    const [articleStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT a.id) as totalArticles,
        COALESCE(AVG(
          CASE 
            WHEN lr.completed = 1 THEN 100 
            ELSE 0 
          END
        ), 0) as averageCompletionRate
      FROM articles a
      LEFT JOIN learning_records lr ON a.id = lr.article_id
    `);

    // 获取总学习时长和平均成绩
    const [learningStats] = await pool.query(`
      SELECT 
        COALESCE(SUM(study_time) / 60, 0) as totalStudyHours,
        COALESCE(AVG(score), 0) as averageScore
      FROM learning_records
      WHERE completed = 1
    `);

    // 获取最近活动（最近10条）
    const [recentActivities] = await pool.query(`
      SELECT 
        u.name as userName,
        a.title as articleTitle,
        lr.action_type,
        lr.created_at as activityTime
      FROM (
        SELECT 
          user_id,
          article_id,
          created_at,
          'started' as action_type
        FROM learning_records
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL
        SELECT 
          user_id,
          article_id,
          completed_at as created_at,
          'completed' as action_type
        FROM learning_records
        WHERE completed = 1 AND completed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      ) lr
      JOIN users u ON lr.user_id = u.id
      JOIN articles a ON lr.article_id = a.id
      ORDER BY lr.created_at DESC
      LIMIT 10
    `);

    // 获取学习排行榜（前10名）
    const [leaderboard] = await pool.query(`
      SELECT 
        u.name,
        u.username,
        u.department,
        u.job_type,
        COUNT(DISTINCT lr.article_id) as completedArticles,
        COALESCE(SUM(lr.study_time) / 60, 0) as totalStudyHours,
        COALESCE(AVG(lr.score), 0) as averageScore
      FROM users u
      LEFT JOIN learning_records lr ON u.id = lr.user_id AND lr.completed = 1
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY completedArticles DESC, totalStudyHours DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: userStats[0].totalUsers || 0,
          activeUsers: userStats[0].activeUsers || 0,
          totalArticles: articleStats[0].totalArticles || 0,
          averageCompletionRate: Math.round(articleStats[0].averageCompletionRate || 0),
          totalStudyTime: Math.round(learningStats[0].totalStudyHours || 0),
          averageScore: Math.round(learningStats[0].averageScore || 0)
        },
        recentActivities: recentActivities.map(activity => ({
          userName: activity.userName,
          articleTitle: activity.articleTitle,
          actionType: activity.action_type,
          time: activity.activityTime
        })),
        leaderboard: leaderboard.map(user => ({
          name: user.name,
          username: user.username,
          department: user.department,
          jobType: user.job_type,
          completedArticles: parseInt(user.completedArticles),
          totalStudyHours: Math.round(user.totalStudyHours * 10) / 10,
          averageScore: Math.round(user.averageScore)
        }))
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

// 获取部门统计
router.get('/departments', async (req, res) => {
  try {
    const [departmentStats] = await pool.query(`
      SELECT 
        u.department,
        COUNT(DISTINCT u.id) as userCount,
        COUNT(DISTINCT lr.article_id) as completedArticles,
        COALESCE(AVG(lr.score), 0) as averageScore
      FROM users u
      LEFT JOIN learning_records lr ON u.id = lr.user_id AND lr.completed = 1
      WHERE u.role = 'user'
      GROUP BY u.department
      ORDER BY userCount DESC
    `);

    res.json({
      success: true,
      data: departmentStats
    });
  } catch (error) {
    console.error('获取部门统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取部门统计失败'
    });
  }
});

// 获取工种统计
router.get('/job-types', async (req, res) => {
  try {
    const [jobTypeStats] = await pool.query(`
      SELECT 
        u.job_type,
        COUNT(DISTINCT u.id) as userCount,
        COUNT(DISTINCT lr.article_id) as completedArticles,
        COALESCE(AVG(lr.score), 0) as averageScore
      FROM users u
      LEFT JOIN learning_records lr ON u.id = lr.user_id AND lr.completed = 1
      WHERE u.role = 'user' AND u.job_type IS NOT NULL
      GROUP BY u.job_type
      ORDER BY userCount DESC
    `);

    res.json({
      success: true,
      data: jobTypeStats
    });
  } catch (error) {
    console.error('获取工种统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取工种统计失败'
    });
  }
});

// 获取学习趋势（最近30天）
router.get('/trends', async (req, res) => {
  try {
    const [trends] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as activeUsers,
        COUNT(*) as learningCount,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completedCount
      FROM learning_records
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('获取学习趋势失败:', error);
    res.status(500).json({
      success: false,
      error: '获取学习趋势失败'
    });
  }
});

// 获取当前用户的个人统计
router.get('/user/me', async (req, res) => {
  try {
    const userId = req.user?.id; // 从JWT token中获取用户ID
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权访问'
      });
    }

    // 获取文章总数
    const [articleCount] = await pool.query('SELECT COUNT(*) as total FROM articles');
    
    // 获取用户学习统计
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT article_id) as completedArticles,
        COALESCE(SUM(study_time), 0) as totalStudyTime,
        COALESCE(AVG(score), 0) as averageScore
      FROM learning_records
      WHERE user_id = ? AND completed = 1
    `, [userId]);

    // 获取连续学习天数
    const [streakData] = await pool.query(`
      SELECT 
        COUNT(DISTINCT DATE(created_at)) as streak
      FROM learning_records
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `, [userId]);

    // 获取各领域成绩（模拟数据，实际应根据文章分类统计）
    const [domainScores] = await pool.query(`
      SELECT 
        CASE 
          WHEN a.category LIKE '%安全%' THEN 'safety'
          WHEN a.category LIKE '%维护%' THEN 'maintenance'
          WHEN a.category LIKE '%应急%' THEN 'emergency'
          WHEN a.category LIKE '%信号%' THEN 'signal'
          WHEN a.category LIKE '%调度%' THEN 'dispatch'
          ELSE 'operation'
        END as domain,
        AVG(lr.score) as avgScore
      FROM learning_records lr
      JOIN articles a ON lr.article_id = a.id
      WHERE lr.user_id = ? AND lr.completed = 1
      GROUP BY domain
    `, [userId]);

    // 处理领域成绩数据
    const domains = {
      safety: 0,
      maintenance: 0,
      emergency: 0,
      signal: 0,
      dispatch: 0,
      operation: 0
    };
    
    domainScores.forEach(item => {
      if (item.domain && domains.hasOwnProperty(item.domain)) {
        domains[item.domain] = Math.round(item.avgScore || 0);
      }
    });

    // 获取最近学习记录
    const [recentLearning] = await pool.query(`
      SELECT 
        a.title as articleTitle,
        lr.completed_at as completedAt
      FROM learning_records lr
      JOIN articles a ON lr.article_id = a.id
      WHERE lr.user_id = ? AND lr.completed = 1
      ORDER BY lr.completed_at DESC
      LIMIT 3
    `, [userId]);

    res.json({
      success: true,
      data: {
        totalArticles: articleCount[0].total || 15,
        completedArticles: parseInt(userStats[0].completedArticles) || 0,
        totalStudyTime: parseInt(userStats[0].totalStudyTime) || 0,
        averageScore: Math.round(userStats[0].averageScore) || 0,
        currentStreak: parseInt(streakData[0].streak) || 0,
        domainScores: domains,
        recentLearning: recentLearning.map(item => ({
          articleTitle: item.articleTitle,
          completedAt: item.completedAt
        }))
      }
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户统计失败'
    });
  }
});

module.exports = router;
