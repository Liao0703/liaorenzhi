import React, { useState, useEffect } from 'react';
import RoleLayout, { Card } from './components/RoleLayout';
import type { RoleNavItem } from './components/RoleLayout';
import { useNavigate } from 'react-router-dom';
// 切换为实时接口数据
import { articleAPI } from './config/api';
import HexagonChart from './components/HexagonChart';
import { learningRecordAPI } from './config/api';
import { overviewStatisticsService } from './services/overviewStatisticsService';

interface RoleHomeProps {
  user: any;
  onLogout: () => void;
}

const RoleHome: React.FC<RoleHomeProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isRefreshingOverview, setIsRefreshingOverview] = useState(false);
  // 普通用户实时数据
  const [userArticles, setUserArticles] = useState<any[]>([]);
  const [userRecords, setUserRecords] = useState<any[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [overviewStats, setOverviewStats] = useState<{totalUsers:number;activeUsers:number;totalArticles:number;averageCompletionRate:number;totalStudyTime:number;averageScore:number}>({
    totalUsers: 0,
    activeUsers: 0,
    totalArticles: 0,
    averageCompletionRate: 0,
    totalStudyTime: 0,
    averageScore: 0
  });
  const [recentActivities, setRecentActivities] = useState<Array<{description?:string;userName?:string;timeAgo?:string;activityTime?:string}>>([]);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 获取排行榜数据（仅管理员/维护人员需要）
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'maintenance') {
      loadLeaderboard();
    }
  }, [user]);

  // 普通用户：拉取实时文章与学习记录
  useEffect(() => {
    const loadUserRealtime = async () => {
      if (user?.role !== 'user' || !user?.id) return;
      setIsLoadingUserData(true);
      try {
        const [articlesRes, recordsRes] = await Promise.all([
          articleAPI.getAll(),
          learningRecordAPI.getByUserId(String(user.id))
        ]);
        setUserArticles(articlesRes?.success ? (articlesRes.data || []) : []);
        setUserRecords(recordsRes?.success ? (recordsRes.data || []) : []);
      } catch (error) {
        console.error('加载普通用户实时数据失败:', error);
        setUserArticles([]);
        setUserRecords([]);
      } finally {
        setIsLoadingUserData(false);
      }
    };
    loadUserRealtime();
  }, [user]);

  // 管理员/维护首页加载系统概览
  useEffect(() => {
    const loadOverview = async () => {
      if (user?.role === 'admin' || user?.role === 'maintenance') {
        try {
          const data = await overviewStatisticsService.getOverviewStats();
          setOverviewStats(data.stats);
          setRecentActivities(data.recentActivities || []);
        } catch (e) {
          console.error('加载首页概览失败', e);
        }
      }
    };
    loadOverview();
  }, [user]);

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const response = await learningRecordAPI.getLeaderboard(10); // 获取前10名
      if (response.success) {
        setLeaderboard(response.data);
      } else {
        console.error('获取排行榜失败:', response.error);
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('获取排行榜异常:', error);
      setLeaderboard([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const reloadOverview = async () => {
    if (user?.role === 'admin' || user?.role === 'maintenance') {
      try {
        const data = await overviewStatisticsService.getOverviewStats();
        setOverviewStats(data.stats);
        setRecentActivities(data.recentActivities || []);
      } catch (e) {
        console.error('重新加载首页概览失败', e);
      }
    }
  };

  const handleRefreshOverview = async () => {
    try {
      setIsRefreshingOverview(true);
      const ok = await overviewStatisticsService.refreshStats();
      if (!ok) {
        console.warn('刷新概览统计失败');
      }
      await reloadOverview();
    } finally {
      setIsRefreshingOverview(false);
    }
  };

  const commonActions = (
    <>
      {(user?.role === 'admin' || user?.role === 'maintenance') && (
        <button
          onClick={handleRefreshOverview}
          disabled={isRefreshingOverview}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: isRefreshingOverview ? '#e5e7eb' : 'transparent',
            color: '#111827',
            cursor: isRefreshingOverview ? 'not-allowed' : 'pointer',
            fontSize: 13,
            marginRight: 8,
          }}
        >
          {isRefreshingOverview ? '刷新中…' : '刷新概览'}
        </button>
      )}
      <button
        onClick={onLogout}
        style={{
          padding: '8px 14px',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          background: 'transparent',
          color: '#111827',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        退出登录
      </button>
    </>
  );

  const buildNav = (): RoleNavItem[] => {
    if (user?.role === 'admin') {
      return [
        { key: 'home', label: '概览', icon: '🏠', active: true },
        { key: 'users', label: '用户学习总览', icon: '👥', to: '/admin', query: { tab: 'users' } },
        { key: 'article-records', label: '学习记录查询', icon: '📋', to: '/admin', query: { tab: 'article-records' } },
        { key: 'articles', label: '文章管理', icon: '📄', to: '/admin', query: { tab: 'articles' } },
        { key: 'stats', label: '统计分析', icon: '📊', to: '/admin', query: { tab: 'statistics' } },
        { key: 'photos', label: '照片管理', icon: '📷', to: '/admin', query: { tab: 'photos' } },
        { key: 'settings', label: '系统设置', icon: '⚙️', to: '/admin', section: 'other', query: { tab: 'settings' } },
      ];
    }
    if (user?.role === 'maintenance') {
      return [
        { key: 'home', label: '概览', icon: '🏠', active: true },
        { key: 'maintenance', label: '维护模式', icon: '🛠️', to: '/maintenance-admin', query: { tab: 'maintenance' } },
        { key: 'users', label: '用户账号管理', icon: '👥', to: '/maintenance-admin', query: { tab: 'users' } },
      ];
    }
    // 普通用户
    return [
      { key: 'home', label: '概览', icon: '🏠', active: true },
      { key: 'learn', label: '学习中心', icon: '📚', to: '/articles', badgeText: '新' },
      { key: 'settings', label: '个人设置', icon: '⚙️', section: 'other', to: '/settings' },
    ];
  };

  return (
    <RoleLayout
      user={user}
      title={
        user?.role === 'admin' ? '系统管理员概览' :
        user?.role === 'maintenance' ? '维护人员概览' : '学习概览'
      }
      navItems={buildNav()}
      headerActions={commonActions}
    >
      {user?.role === 'user' ? (
        <>
          {(() => {
            const allArticles = userArticles;
            const records = [...userRecords]
              .map((r: any) => ({
                userId: String(r.userId || r.user_id || user?.id || ''),
                userName: r.name || r.username || user?.name || user?.username || '',
                articleId: String(r.articleId || r.article_id || ''),
                articleTitle: r.articleTitle || r.article_title || '',
                readingTime: Number(r.studyDuration ?? r.readingTime ?? 0),
                quizScore: Number(r.score ?? r.quizScore ?? 0),
                photos: r.photos || [],
                completedAt: String(r.completionTime || r.completedAt || ''),
                status: (r.status || (r.quizCompleted ? 'completed' : 'incomplete')) as 'completed' | 'incomplete'
              }))
              .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
            const completedArticleIds = new Set(records.map(r => r.articleId));
            const completedCount = completedArticleIds.size;
            const totalArticles = allArticles.length;
            const totalMinutes = records.reduce((sum, r) => sum + (r.readingTime || 0), 0);
            const avgScore = records.length ? Math.round(records.reduce((s, r) => s + (r.quizScore || 0), 0) / records.length) : 0;
            const nextArticle = allArticles.find(a => !completedArticleIds.has(String(a.id)));

            return (
              <>
                {/* 个人关键指标 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                  marginBottom: 18,
                }}>
                  <Card>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>我的进度</div>
                    <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#2563eb' }}>{completedCount}/{totalArticles}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>已完成 {totalArticles ? Math.round(completedCount / totalArticles * 100) : 0}%</div>
                  </Card>
                  <Card>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>累计学习时长</div>
                    <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#16a34a' }}>{totalMinutes} 分钟</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>平均每篇 {records.length ? Math.round(totalMinutes / records.length) : 0} 分钟</div>
                  </Card>
                  <Card>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>平均成绩</div>
                    <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#f59e0b' }}>{avgScore} 分</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>最近一次 {records[0]?.quizScore ?? 0} 分</div>
                  </Card>
                </div>

                {/* 继续学习 + 最近记录 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', 
                  gap: 16 
                }}>
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700 }}>继续学习</div>
                      <button onClick={() => navigate('/articles')} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' }}>进入学习中心</button>
                    </div>
                    {nextArticle ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px', border: '1px solid #eef2f7', borderRadius: 10, background: '#f8fafc' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{nextArticle.title}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>分类：{nextArticle.category} · 要求时长：{nextArticle.requiredReadingTime} 分钟</div>
                        </div>
                        <button onClick={() => navigate(`/article/${nextArticle.id}`)} style={{ padding: '8px 12px', background: 'linear-gradient(90deg,#3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>开始</button>
                      </div>
                    ) : (
                      <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 10 }}>🎉 已完成全部课程，去复习巩固一下吧</div>
                    )}
                  </Card>
                  <Card>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>我的最近记录</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(records.slice(0,5)).length > 0 ? (
                        records.slice(0,5).map((r) => (
                          <div key={`${r.articleId}_${r.completedAt}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #eef2f7' }}>
                            <span style={{ fontSize: 14 }}>完成《{r.articleTitle || (allArticles.find(a => String(a.id) === r.articleId)?.title || '')}》 学习（{r.quizScore}分）</span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.completedAt ? new Date(r.completedAt).toLocaleString() : ''}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 10, color: '#6b7280' }}>暂无学习记录，先从“学习中心”开始一篇吧</div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* 成绩模块：只保留六边形预览 */}
                <div style={{ 
                  marginTop: 16 
                }}>
                  <Card>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>我的成绩预览</div>
                    {(() => {
                      // 依据用户记录估算各类成绩
                      const defaultScores = { safety: 0, maintenance: 0, emergency: 0, signal: 0, dispatch: 0, operation: 0 };
                      const categoryMap: Record<string, keyof typeof defaultScores> = {
                        '安全规程': 'safety',
                        '设备维护': 'maintenance',
                        '应急处理': 'emergency',
                        '信号系统': 'signal',
                        '调度规范': 'dispatch',
                        '作业标准': 'operation'
                      };
                      const catScores: Record<keyof typeof defaultScores, number[]> = {
                        safety: [], maintenance: [], emergency: [], signal: [], dispatch: [], operation: []
                      };
                      records.forEach(r => {
                        const article = allArticles.find(a => String(a.id) === r.articleId);
                        if (article) {
                          const key = categoryMap[article.category];
                          if (key) catScores[key].push(r.quizScore || 0);
                        }
                      });
                      const scores = {
                        safety: catScores.safety.length ? Math.round(catScores.safety.reduce((s, v) => s + v, 0) / catScores.safety.length) : 0,
                        maintenance: catScores.maintenance.length ? Math.round(catScores.maintenance.reduce((s, v) => s + v, 0) / catScores.maintenance.length) : 0,
                        emergency: catScores.emergency.length ? Math.round(catScores.emergency.reduce((s, v) => s + v, 0) / catScores.emergency.length) : 0,
                        signal: catScores.signal.length ? Math.round(catScores.signal.reduce((s, v) => s + v, 0) / catScores.signal.length) : 0,
                        dispatch: catScores.dispatch.length ? Math.round(catScores.dispatch.reduce((s, v) => s + v, 0) / catScores.dispatch.length) : 0,
                        operation: catScores.operation.length ? Math.round(catScores.operation.reduce((s, v) => s + v, 0) / catScores.operation.length) : 0,
                      };
                      return <HexagonChart scores={scores} />;
                    })()}
                  </Card>
                </div>
              </>
            );
          })()}
        </>
      ) : (
        <>
          {/* 管理端/维护端沿用原有概览内容 */}
          {/* 顶部关键指标 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 18,
      }}>
        <Card>
          <div style={{ fontSize: 14, color: '#6b7280' }}>总用户数</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#2563eb' }}>{overviewStats.totalUsers}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>活跃用户：{overviewStats.activeUsers}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, color: '#6b7280' }}>文章总数</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#16a34a' }}>{overviewStats.totalArticles}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>平均完成率：{overviewStats.averageCompletionRate}%</div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, color: '#6b7280' }}>总学习时长</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#f59e0b' }}>{overviewStats.totalStudyTime}h</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>平均成绩：{overviewStats.averageScore}分</div>
        </Card>
      </div>

                {/* 下面两列布局：最近活动 + 成绩排行 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', 
        gap: 16 
      }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>最近活动</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentActivities.length > 0 ? (
              recentActivities.slice(0,3).map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 12px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #eef2f7',
                }}>
                  <span style={{ fontSize: 14 }}>{item.userName ? `${item.userName} · ${item.description || ''}` : (item.description || '')}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{overviewStatisticsService.formatDateTime(item.activityTime || '')}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>暂无最近活动</div>
            )}
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 700 }}>学习排行榜</div>
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin?tab=statistics' : '/maintenance-admin?tab=users')}
              style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: 12 }}
            >查看全部</button>
          </div>
          
          {isLoadingLeaderboard ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              加载中...
            </div>
          ) : leaderboard.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {leaderboard.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    border: '1px solid #eef0f4',
                    borderRadius: 10,
                    background: '#f9fafb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                      {item.team && (
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{item.team}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: item.avgScore >= 90 ? '#ef4444' : 
                             item.avgScore >= 85 ? '#f59e0b' : 
                             item.avgScore >= 80 ? '#eab308' : '#10b981' 
                    }}>
                      {item.avgScore}分
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {item.totalCompleted}篇
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              暂无学习记录
            </div>
          )}
        </Card>
      </div>

          {/* 信息卡片 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit,minmax(180px,1fr))', 
        gap: 12, 
        marginTop: 16 
      }}>
        {[
          { title: '积分奖励', icon: '🏅' },
          { title: '公告公示', icon: '📢' },
          { title: '联系方式', icon: '☎️' },
        ].map((d, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{d.icon}</span>
              <div style={{ fontWeight: 600 }}>{d.title}</div>
            </div>
          </Card>
        ))}
      </div>
        </>
      )}
    </RoleLayout>
  );
};

export default RoleHome;


