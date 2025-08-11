import React from 'react';
import RoleLayout, { Card } from './components/RoleLayout';
import type { RoleNavItem } from './components/RoleLayout';
import { useNavigate } from 'react-router-dom';
import { getAllArticles } from './articleData';
import { getUserLearningRecords } from './photoStorage';
import HexagonChart from './components/HexagonChart';

interface RoleHomeProps {
  user: any;
  onLogout: () => void;
}

const RoleHome: React.FC<RoleHomeProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const commonActions = (
    <>
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
        { key: 'users', label: '学习记录', icon: '👥', to: '/admin', query: { tab: 'users' } },
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
      { key: 'settings', label: '个人设置', icon: '⚙️', section: 'other', to: '/dashboard' },
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
            const allArticles = getAllArticles();
            const rawRecords = getUserLearningRecords(String(user?.id ?? ''))
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
            // Demo 填充：若无真实记录，提供两条示例记录
            const demoRecords = [
              {
                userId: String(user?.id ?? ''),
                userName: user?.name || user?.username || '演示用户',
                articleId: '1',
                articleTitle: '铁路安全操作规程',
                readingTime: 32,
                quizScore: 86,
                photos: [],
                completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
                status: 'completed' as const,
              },
              {
                userId: String(user?.id ?? ''),
                userName: user?.name || user?.username || '演示用户',
                articleId: '2',
                articleTitle: '设备维护保养指南',
                readingTime: 47,
                quizScore: 78,
                photos: [],
                completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                status: 'completed' as const,
              }
            ];
            const records = rawRecords.length ? rawRecords : demoRecords;
            const completedArticleIds = new Set(records.map(r => r.articleId));
            const completedCount = completedArticleIds.size;
            const totalArticles = allArticles.length;
            const totalMinutes = records.reduce((sum, r) => sum + (r.readingTime || 0), 0);
            const avgScore = records.length ? Math.round(records.reduce((s, r) => s + (r.quizScore || 0), 0) / records.length) : 0;
            const nextArticle = allArticles.find(a => !completedArticleIds.has(a.id));

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
                    <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#16a34a' }}>{totalMinutes || 79} 分钟</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>平均每篇 {records.length ? Math.round(totalMinutes / records.length) : 39} 分钟</div>
                  </Card>
                  <Card>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>平均成绩</div>
                    <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#f59e0b' }}>{avgScore || 82} 分</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>最近一次 {records[0]?.quizScore ?? 86} 分</div>
                  </Card>
                </div>

                {/* 继续学习 + 最近记录 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
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
                            <span style={{ fontSize: 14 }}>完成《{r.articleTitle}》 学习（{r.quizScore}分）</span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(r.completedAt).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 10, color: '#6b7280' }}>暂无学习记录，先从“学习中心”开始一篇吧</div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* 成绩模块：排行榜 + 六边形预览 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700 }}>成绩排行</div>
                    </div>
                    {(() => {
                      // 与登录页统一来源
                      const ranks = [
                        { name: '王五', score: 92 },
                        { name: '孙七', score: 90 },
                        { name: '赵六', score: 88 },
                        { name: '吴九', score: 86 },
                        { name: '张三', score: 85 }
                      ];
                      return (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {ranks.map((item, idx) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #eef0f4', borderRadius: 10, background: '#f9fafb' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 16 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</span>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{item.score}分</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </Card>

                  <Card>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>我的成绩预览</div>
                    {(() => {
                      // 依据用户记录粗略估算各类成绩（示例：平均分或默认值）
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
                        const article = allArticles.find(a => a.id === r.articleId);
                        if (article) {
                          const key = categoryMap[article.category];
                          if (key) catScores[key].push(r.quizScore || 0);
                        }
                      });
                      let scores = {
                        safety: catScores.safety.length ? Math.round(catScores.safety.reduce((s, v) => s + v, 0) / catScores.safety.length) : 0,
                        maintenance: catScores.maintenance.length ? Math.round(catScores.maintenance.reduce((s, v) => s + v, 0) / catScores.maintenance.length) : 0,
                        emergency: catScores.emergency.length ? Math.round(catScores.emergency.reduce((s, v) => s + v, 0) / catScores.emergency.length) : 0,
                        signal: catScores.signal.length ? Math.round(catScores.signal.reduce((s, v) => s + v, 0) / catScores.signal.length) : 0,
                        dispatch: catScores.dispatch.length ? Math.round(catScores.dispatch.reduce((s, v) => s + v, 0) / catScores.dispatch.length) : 0,
                        operation: catScores.operation.length ? Math.round(catScores.operation.reduce((s, v) => s + v, 0) / catScores.operation.length) : 0,
                      };
                      const noData = Object.values(scores).every(v => v === 0);
                      if (noData) {
                        // Demo默认分数，避免全为0
                        scores = { safety: 82, signal: 88, dispatch: 75, operation: 80, emergency: 78, maintenance: 76 } as typeof scores;
                      }
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
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#2563eb' }}>8</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>活跃用户：6</div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, color: '#6b7280' }}>文章总数</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#16a34a' }}>15</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>平均完成率：5%</div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, color: '#6b7280' }}>总学习时长</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, color: '#f59e0b' }}>22h</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>平均成绩：85分</div>
        </Card>
      </div>

      {/* 下面两列布局：最近活动 + 成绩排行 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>最近活动</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[ 
              { text: '张三 完成了《铁路安全操作规程》学习', time: '2024-01-15 14:30' },
              { text: '李四 开始学习《设备维护保养指南》', time: '2024-01-15 13:45' },
              { text: '王五 完成了《应急处理流程》测试', time: '2024-01-15 12:20' },
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #eef2f7',
              }}>
                <span style={{ fontSize: 14 }}>{item.text}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 700 }}>成绩排行</div>
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin?tab=statistics' : '/maintenance-admin?tab=users')}
              style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer' }}
            >查看全部</button>
          </div>
          {(() => {
            const mockRanks = [
              { name: '王五', score: 92 },
              { name: '孙七', score: 90 },
              { name: '赵六', score: 88 },
              { name: '吴九', score: 86 },
              { name: '张三', score: 85 },
              { name: '周八', score: 82 },
              { name: '郑十', score: 79 },
              { name: '李四', score: 78 },
            ].sort((a, b) => b.score - a.score).slice(0, 5);

            const getScoreColor = (s: number) => {
              if (s >= 90) return '#ef4444';
              if (s >= 85) return '#f59e0b';
              if (s >= 80) return '#eab308';
              return '#10b981';
            };

            const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅');

            return (
              <div style={{ display: 'grid', gap: 10 }}>
                {mockRanks.map((item, idx) => (
                  <div
                    key={item.name}
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
                      <span style={{ fontSize: 16 }}>{medal(idx + 1)}</span>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(item.score) }}>{item.score}分</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>
      </div>

          {/* 信息卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
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


