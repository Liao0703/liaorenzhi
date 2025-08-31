
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { statisticsCache, clearStatisticsCache, getCacheStats, CACHE_KEYS } = require('../middleware/statistics-cache');

// 中间件：验证管理员权限
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: '需要管理员权限' });
  }
};

// 获取管理员概览统计数据
router.get('/overview', statisticsCache(CACHE_KEYS.OVERVIEW_STATS, 300), async (req, res) => {
  try {
    // 1. 获取基础统计数据
    const [basicStats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'user') as totalUsers,
        (SELECT COUNT(DISTINCT user_id) FROM learning_records 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) as activeUsers,
        (SELECT COUNT(*) FROM articles) as totalArticles,
        (SELECT COALESCE(AVG(CASE WHEN completed = 1 THEN 100 ELSE 0 END), 0) 
         FROM learning_records) as averageCompletionRate,
        (SELECT COALESCE(SUM(study_time) / 60, 0) FROM learning_records) as totalStudyHours,
        (SELECT COALESCE(AVG(score), 0) FROM learning_records WHERE completed = 1) as averageScore
    `);

    // 2. 获取最近活动（最近20条）
    const [recentActivities] = await pool.query(`
      SELECT 
        ua.id,
        u.name as userName,
        u.department,
        ua.activity_type as activityType,
        a.title as articleTitle,
        ua.created_at as activityTime,
        CASE 
          WHEN ua.activity_type = 'login' THEN '登录系统'
          WHEN ua.activity_type = 'start_learning' THEN CONCAT('开始学习《', IFNULL(a.title, ''), '》')
          WHEN ua.activity_type = 'complete_article' THEN CONCAT('完成了《', IFNULL(a.title, ''), '》')
          WHEN ua.activity_type = 'take_quiz' THEN CONCAT('参加了《', IFNULL(a.title, ''), '》的测试')
          ELSE ua.activity_type
        END as description
      FROM user_activities ua
      JOIN users u ON ua.user_id = u.id
      LEFT JOIN articles a ON ua.article_id = a.id
      ORDER BY ua.created_at DESC
      LIMIT 20
    `);

    // 3. 获取学习排行榜（前10名）
    const [leaderboard] = await pool.query(`
      SELECT 
        u.id as userId,
        u.name as userName,
        u.department,
        u.job_type as jobType,
        COUNT(DISTINCT lr.article_id) as completedCount,
        COALESCE(SUM(lr.study_time) / 60, 0) as studyHours,
        COALESCE(AVG(lr.score), 0) as averageScore,
        COUNT(DISTINCT DATE(lr.created_at)) as activeDays,
        CASE 
          WHEN ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT lr.article_id) DESC) = 1 THEN '🥇'
          WHEN ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT lr.article_id) DESC) = 2 THEN '🥈'
          WHEN ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT lr.article_id) DESC) = 3 THEN '🥉'
          ELSE ''
        END as medal
      FROM users u
      LEFT JOIN learning_records lr ON u.id = lr.user_id AND lr.completed = 1
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY completedCount DESC, studyHours DESC, averageScore DESC
      LIMIT 10
    `);

    // 4. 获取部门统计
    const [departmentStats] = await pool.query(`
      SELECT 
        department,
        user_count as userCount,
        active_user_count as activeUserCount,
        avg_study_time as avgStudyTime,
        avg_score as avgScore,
        completion_rate as completionRate
      FROM department_statistics
      ORDER BY user_count DESC
      LIMIT 10
    `);

    // 5. 获取工种统计
    const [jobTypeStats] = await pool.query(`
      SELECT 
        job_type as jobType,
        user_count as userCount,
        active_user_count as activeUserCount,
        avg_study_time as avgStudyTime,
        avg_score as avgScore,
        completion_rate as completionRate
      FROM job_type_statistics
      ORDER BY user_count DESC
      LIMIT 10
    `);

    // 6. 获取最近7天的学习趋势
    const [learningTrend] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as activeUsers,
        COUNT(*) as learningCount,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completedCount,
        COALESCE(SUM(study_time) / 60, 0) as totalHours
      FROM learning_records
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 7. 获取文章完成情况统计
    const [articleStats] = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.category,
        COUNT(DISTINCT lr.user_id) as learnersCount,
        AVG(CASE WHEN lr.completed = 1 THEN 100 ELSE 0 END) as completionRate,
        AVG(lr.study_time) as avgStudyTime,
        AVG(CASE WHEN lr.completed = 1 THEN lr.score END) as avgScore
      FROM articles a
      LEFT JOIN learning_records lr ON a.id = lr.article_id
      GROUP BY a.id
      ORDER BY learnersCount DESC
      LIMIT 10
    `);

    // 格式化返回数据
    const responseData = {
      success: true,
      data: {
        stats: {
          totalUsers: basicStats[0].totalUsers || 0,
          activeUsers: basicStats[0].activeUsers || 0,
          totalArticles: basicStats[0].totalArticles || 0,
          averageCompletionRate: Math.round(basicStats[0].averageCompletionRate || 0),
          totalStudyTime: Math.round(basicStats[0].totalStudyHours || 0),
          averageScore: Math.round(basicStats[0].averageScore || 0)
        },
        recentActivities: recentActivities.map(activity => ({
          ...activity,
          timeAgo: getTimeAgo(activity.activityTime)
        })),
        leaderboard: leaderboard.map((user, index) => ({
          ...user,
          rank: index + 1,
          studyHours: Math.round(user.studyHours * 10) / 10,
          averageScore: Math.round(user.averageScore)
        })),
        departmentStats,
        jobTypeStats,
        learningTrend,
        articleStats: articleStats.map(article => ({
          ...article,
          completionRate: Math.round(article.completionRate || 0),
          avgStudyTime: Math.round(article.avgStudyTime || 0),
          avgScore: Math.round(article.avgScore || 0)
        }))
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error('获取概览统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取统计数据失败',
      details: error.message 
    });
  }
});

// 最近活动分页列表（管理员）
router.get('/activities', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM user_activities');

    const [rows] = await pool.query(
      `SELECT 
        ua.id,
        u.name as userName,
        u.department,
        ua.activity_type as activityType,
        a.title as articleTitle,
        ua.created_at as activityTime,
        CASE 
          WHEN ua.activity_type = 'login' THEN '登录系统'
          WHEN ua.activity_type = 'start_learning' THEN CONCAT('开始学习《', IFNULL(a.title, ''), '》')
          WHEN ua.activity_type = 'complete_article' THEN CONCAT('完成了《', IFNULL(a.title, ''), '》')
          WHEN ua.activity_type = 'take_quiz' THEN CONCAT('参加了《', IFNULL(a.title, ''), '》的测试')
          ELSE ua.activity_type
        END as description
      FROM user_activities ua
      JOIN users u ON ua.user_id = u.id
      LEFT JOIN articles a ON ua.article_id = a.id
      ORDER BY ua.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: {
        items: rows,
        page,
        limit,
        total,
        hasNext: offset + rows.length < total
      }
    });
  } catch (error) {
    console.error('获取最近活动分页失败:', error);
    res.status(500).json({ success: false, error: '获取最近活动失败' });
  }
});

// 获取实时统计数据（用于自动刷新）
router.get('/realtime', statisticsCache(CACHE_KEYS.REALTIME_STATS, 60), async (req, res) => {
  try {
    // 获取最新的关键指标
    const [realtimeStats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'user') as totalUsers,
        (SELECT COUNT(DISTINCT user_id) FROM user_activities 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)) as onlineUsers,
        (SELECT COUNT(*) FROM learning_records 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)) as recentLearnings,
        (SELECT COUNT(*) FROM learning_records 
         WHERE completed = 1 AND completed_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)) as recentCompletions
    `);

    res.json({
      success: true,
      data: realtimeStats[0],
      timestamp: new Date()
    });
  } catch (error) {
    console.error('获取实时统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取实时数据失败' 
    });
  }
});

// 触发统计数据更新
router.post('/refresh', requireAdmin, async (req, res) => {
  try {
    // 调用存储过程更新统计
    await pool.query('CALL sp_update_daily_statistics(CURDATE())');
    await pool.query('CALL sp_update_department_statistics()');
    await pool.query('CALL sp_update_job_type_statistics()');

    // 清除相关缓存
    clearStatisticsCache('');
    
    res.json({
      success: true,
      message: '统计数据已更新，缓存已清除',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('更新统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新统计数据失败' 
    });
  }
});

// 获取部门详细统计
router.get('/departments/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    const [departmentDetail] = await pool.query(`
      SELECT 
        u.id as userId,
        u.name as userName,
        u.job_type as jobType,
        COUNT(DISTINCT lr.article_id) as completedArticles,
        COALESCE(SUM(lr.study_time) / 60, 0) as studyHours,
        COALESCE(AVG(lr.score), 0) as averageScore,
        MAX(lr.created_at) as lastActiveTime
      FROM users u
      LEFT JOIN learning_records lr ON u.id = lr.user_id
      WHERE u.department = ? AND u.role = 'user'
      GROUP BY u.id
      ORDER BY completedArticles DESC
    `, [department]);

    res.json({
      success: true,
      data: departmentDetail
    });
  } catch (error) {
    console.error('获取部门详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取部门详情失败' 
    });
  }
});

// 用户学习总览（支持筛选：unit/department/team/jobType，均为可选）
router.get('/users-overview', async (req, res) => {
  try {
    const { unit, department, team, jobType } = req.query;

    const whereClauses = ["u.role = 'user'"];
    const params = [];
    // 前端传 unit，这里映射为 users.company 字段
    if (unit) { whereClauses.push('u.company = ?'); params.push(unit); }
    if (department) { whereClauses.push('u.department = ?'); params.push(department); }
    if (team) { whereClauses.push('u.team = ?'); params.push(team); }
    if (jobType) { whereClauses.push('u.job_type = ?'); params.push(jobType); }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.name,
        u.company AS unit,
        u.department,
        u.team,
        u.job_type AS jobType,
        COALESCE(COUNT(DISTINCT CASE WHEN lr.completed = 1 THEN lr.article_id END), 0) AS completedArticles,
        COALESCE(SUM(lr.study_time), 0) AS totalStudyTime,
        COALESCE(AVG(CASE WHEN lr.completed = 1 THEN lr.score END), 0) AS averageScore,
        MAX(CASE WHEN lr.completed = 1 THEN lr.completed_at ELSE lr.created_at END) AS lastStudyTime
      FROM users u
      LEFT JOIN learning_records lr ON lr.user_id = u.id
      ${whereSql}
      GROUP BY u.id
      ORDER BY u.department, u.team, u.name`,
      params
    );

    const data = rows.map(r => ({
      id: r.id,
      username: r.username,
      name: r.name,
      unit: r.unit,
      department: r.department,
      team: r.team,
      jobType: r.jobType,
      completedArticles: Number(r.completedArticles) || 0,
      totalStudyTime: Number(r.totalStudyTime) || 0,
      averageScore: Math.round(Number(r.averageScore) || 0),
      lastStudyTime: r.lastStudyTime,
      status: r.lastStudyTime && new Date(r.lastStudyTime) > new Date(Date.now() - 7*24*3600*1000) ? 'active' : 'inactive'
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('获取用户学习总览失败:', error);
    res.status(500).json({ success: false, error: '获取用户学习总览失败' });
  }
});

// 获取工种详细统计
router.get('/job-types/:jobType', async (req, res) => {
  try {
    const { jobType } = req.params;
    
    const [jobTypeDetail] = await pool.query(`
      SELECT 
        u.id as userId,
        u.name as userName,
        u.department,
        COUNT(DISTINCT lr.article_id) as completedArticles,
        COALESCE(SUM(lr.study_time) / 60, 0) as studyHours,
        COALESCE(AVG(lr.score), 0) as averageScore,
        MAX(lr.created_at) as lastActiveTime
      FROM users u
      LEFT JOIN learning_records lr ON u.id = lr.user_id
      WHERE u.job_type = ? AND u.role = 'user'
      GROUP BY u.id
      ORDER BY completedArticles DESC
    `, [jobType]);

    res.json({
      success: true,
      data: jobTypeDetail
    });
  } catch (error) {
    console.error('获取工种详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取工种详情失败' 
    });
  }
});

// 导出统计数据为Excel
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { type = 'overview', format = 'json' } = req.query;
    
    let data;
    switch (type) {
      case 'users':
        [data] = await pool.query('SELECT * FROM v_user_learning_overview');
        break;
      case 'departments':
        [data] = await pool.query('SELECT * FROM department_statistics');
        break;
      case 'jobtypes':
        [data] = await pool.query('SELECT * FROM job_type_statistics');
        break;
      default:
        [data] = await pool.query('SELECT * FROM daily_statistics ORDER BY stat_date DESC LIMIT 30');
    }

    if (format === 'csv') {
      // 转换为CSV格式
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=statistics_${type}_${Date.now()}.csv`);
      res.send('\ufeff' + csv); // 添加BOM以支持中文
    } else {
      res.json({
        success: true,
        type,
        count: data.length,
        data
      });
    }
  } catch (error) {
    console.error('导出统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '导出数据失败' 
    });
  }
});

// 辅助函数：计算时间差
function getTimeAgo(date) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now - activityDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return activityDate.toLocaleDateString('zh-CN');
}

// 辅助函数：转换为CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

// 缓存管理接口
router.get('/cache/stats', requireAdmin, (req, res) => {
  const stats = getCacheStats();
  res.json({
    success: true,
    data: stats
  });
});

router.delete('/cache', requireAdmin, (req, res) => {
  const { pattern } = req.query;
  const clearedCount = clearStatisticsCache(pattern);
  res.json({
    success: true,
    message: `清除了 ${clearedCount} 个缓存项`,
    pattern: pattern || 'all'
  });
});

module.exports = router;
