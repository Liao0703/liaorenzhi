import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllArticles } from './articleData';
import type { ArticleData } from './articleData';

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

    loadArticles();
    // 监听localStorage变化
    const handleStorageChange = () => {
      loadArticles();
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const categories = ['all', '安全规程', '设备维护', '应急处理', '信号系统', '调度规范', '服务标准'];

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

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
      color: '#fff',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '30px',
        padding: '20px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', textAlign: 'center' }}>学习中心</h2>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            alignSelf: 'center'
          }}
        >
          返回首页
        </button>
      </div>

      {/* 分类筛选 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
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
                : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
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
              background: 'rgba(0,0,0,0.3)',
              padding: '15px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
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
                background: 'rgba(64, 158, 255, 0.2)',
                color: '#409eff',
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
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${article.progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              fontSize: '12px',
              opacity: 0.8
            }}>
                                      <span>要求时长：{article.requiredReadingTime}分钟</span>
              {article.score && <span>成绩：{article.score}分</span>}
            </div>

            {article.lastStudyTime && (
              <div style={{
                marginTop: '8px',
                fontSize: '10px',
                opacity: 0.6
              }}>
                最后学习：{article.lastStudyTime}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleList; 