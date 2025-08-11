import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllArticles } from './articleData';
import { CloudArticleService } from './cloudDataService';


interface ArticleListProps {
  user: any;
}

interface Article {
  id: string;
  title: string;
  category: string;
  requiredReadingTime: number; // 分钟
  status: 'not_started' | 'in_progress' | 'completed';
  progress?: number; // 0-100
  score?: number;
  lastStudyTime?: string;
  fileType?: 'pdf' | 'word' | 'none';
  fileName?: string;
}

const ArticleList: React.FC<ArticleListProps> = ({ user: _user }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);

  // 从localStorage获取真实文章数据
  useEffect(() => {
    const loadArticles = () => {
      const realArticles = getAllArticles();
      const articlesWithStatus: Article[] = realArticles.map(article => ({
        id: article.id,
        title: article.title,
        category: article.category,
        requiredReadingTime: article.requiredReadingTime,
        status: 'not_started' as const, // 默认状态
        progress: 0,
        fileType: article.fileType,
        fileName: article.fileName
      }));
      setArticles(articlesWithStatus);
    };

    // 初始加载
    loadArticles();
    
    // 从云端同步数据
    const syncFromCloud = async () => {
      try {
        console.log('开始从云端同步文章数据...');
        const result = await CloudArticleService.forceSync();
        if (result.success) {
          console.log('云端同步成功，重新加载文章数据');
          // 重新加载文章数据
          loadArticles();
        } else {
          console.error('云端同步失败:', result.message);
        }
      } catch (error) {
        console.error('云端同步失败:', error);
      }
    };
    
    // 页面加载时同步一次
    syncFromCloud();
    
    // 监听localStorage变化
    const handleStorageChange = () => {
      console.log('检测到localStorage变化，重新加载文章数据');
      loadArticles();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件，用于手动触发数据重新加载
    const handleDataReload = () => {
      console.log('收到数据重新加载事件');
      loadArticles();
    };
    window.addEventListener('dataReload', handleDataReload);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataReload', handleDataReload);
    };
  }, []);

  const categories = ['all', '安全规程', '设备维护', '应急处理', '信号系统', '调度规范', '作业标准'];

  const filteredArticles = (
    selectedCategory === 'all' ? articles : articles.filter(article => article.category === selectedCategory)
  )
    .filter(article =>
      statusFilter === 'all' ? true : article.status === statusFilter
    )
    .filter(article =>
      searchKeyword.trim() === '' ? true : article.title.toLowerCase().includes(searchKeyword.trim().toLowerCase())
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#67c23a';
      case 'in_progress': return '#e6a23c';
      case 'not_started': return '#909399';
      default: return '#909399';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '学习中';
      case 'not_started': return '未开始';
      default: return '未知';
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      zIndex: 10, 
      padding: '20px',
      color: '#1f2937',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '20px',
        padding: '16px',
        background: 'linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px' }}>学习中心</h2>
            <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.8 }}>挑选课程开始学习，系统将实时记录你的学习进度</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索课程标题"
              style={{
                padding: '8px 12px',
                background: '#fff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                width: '200px'
              }}
            />
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '8px 14px',
                background: '#f3f4f6',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >返回首页</button>
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '6px 12px',
                background: selectedCategory === category 
                  ? 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)' 
                  : 'rgba(0,0,0,0.04)',
                color: selectedCategory === category ? '#fff' : '#111827',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              {category === 'all' ? '全部' : category}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: '全部状态' },
            { key: 'not_started', label: '未开始' },
            { key: 'in_progress', label: '学习中' },
            { key: 'completed', label: '已完成' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key as any)}
              style={{
                padding: '4px 10px',
                background: statusFilter === (item.key as any) ? 'rgba(37,99,235,0.15)' : 'rgba(0,0,0,0.05)',
                color: '#111827',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >{item.label}</button>
          ))}
        </div>
      </div>

      {/* 文章列表 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '15px'
      }}>
        {filteredArticles.map(article => (
          <div
            key={article.id}
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => navigate(`/article/${article.id}`)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', flex: 1, lineHeight: '1.4' }}>{article.title}</h3>
              <span style={{
                padding: '3px 6px',
                background: getStatusColor(article.status),
                color: '#fff',
                borderRadius: '4px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                marginLeft: '8px'
              }}>
                {getStatusText(article.status)}
              </span>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '3px 6px',
                background: 'rgba(37, 99, 235, 0.10)',
                color: '#2563eb',
                borderRadius: '4px',
                fontSize: '10px'
              }}>
                {article.category}
              </span>
              {article.fileType && article.fileType !== 'none' && (
                <span style={{
                  padding: '3px 6px',
                  background: 'rgba(103, 194, 58, 0.2)',
                  color: '#67c23a',
                  borderRadius: '4px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  {article.fileType === 'pdf' ? '📄' : '📝'} {article.fileType.toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>学习进度</span>
                <span style={{ fontSize: '12px' }}>{article.progress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${article.progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#3b82f6 0%,#2563eb 100%)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '12px',
                opacity: 0.85
              }}>
                <span>要求时长：{article.requiredReadingTime}分钟</span>
                {article.score && <span>成绩：{article.score}分</span>}
                {article.lastStudyTime && (
                  <span style={{ opacity: 0.7 }}>最后学习：{article.lastStudyTime}</span>
                )}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/article/${article.id}`); }}
                style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(90deg,#3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >{article.status === 'not_started' ? '开始学习' : '继续学习'}</button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleList; 