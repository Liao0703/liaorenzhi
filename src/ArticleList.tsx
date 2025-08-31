import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllArticles } from './articleData';
import { CloudArticleService } from './cloudDataService';
import { apiClient } from './config/api';


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
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 优先从API获取文章数据，失败则使用本地数据
  useEffect(() => {
    const loadArticles = async () => {
      try {
        // 优先从API获取文章数据
        console.log('正在从API获取文章列表...');
        
        // 构建查询参数，包含用户工种
        const params = new URLSearchParams();
        if (_user && _user.job_type) {
          params.append('user_job_type', _user.job_type);
          console.log('根据用户工种过滤文章:', _user.job_type);
        }
        
        const response = await apiClient.get(`/articles${params.toString() ? '?' + params.toString() : ''}`);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          console.log('API获取文章列表成功:', response.data.length, '篇文章');
          
          const articlesWithStatus: Article[] = response.data.map((serverArticle: any) => ({
            id: serverArticle.id?.toString(),
            title: serverArticle.title,
            category: serverArticle.category || '未分类',
            requiredReadingTime: serverArticle.required_reading_time || 30,
            status: 'not_started' as const,
            progress: 0,
            fileType: serverArticle.file_type || 'none',
            fileName: serverArticle.file_name
          }));
          
          setArticles(articlesWithStatus);
          return;
        } else {
          throw new Error(response.error || '获取文章列表失败');
        }
      } catch (error) {
        console.warn('API获取文章列表失败，使用本地数据:', error);
        
        // API失败时，使用本地数据并按工种过滤
        const realArticles = getAllArticles();
        let filteredArticles = realArticles;
        
        // 如果用户有工种信息，则按工种过滤文章
        if (_user && _user.job_type) {
          filteredArticles = realArticles.filter(article => {
            // 如果文章没有指定工种限制，所有人都可以看
            if (!article.allowedJobTypes || article.allowedJobTypes.length === 0) {
              return true;
            }
            // 检查用户工种是否在允许列表中
            return article.allowedJobTypes.includes(_user.job_type);
          });
          console.log(`根据工种 ${_user.job_type} 过滤后的文章数量:`, filteredArticles.length);
        }
        
        const articlesWithStatus: Article[] = filteredArticles.map(article => ({
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
      }
    };

    // 初始加载
    loadArticles();
    
    // 从云端同步数据（保留云端同步功能作为备用）
    const syncFromCloud = async () => {
      try {
        console.log('开始从云端同步文章数据...');
        const result = await CloudArticleService.forceSync();
        if (result.success) {
          console.log('云端同步成功，重新加载文章数据');
          // 重新加载文章数据
          await loadArticles();
        } else {
          console.error('云端同步失败:', result.message);
        }
      } catch (error) {
        console.error('云端同步失败:', error);
      }
    };
    
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
      padding: isMobile ? '15px' : '20px',
      color: '#1f2937',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '8px' : '10px',
        marginBottom: isMobile ? '15px' : '20px',
        padding: isMobile ? '12px' : '16px',
        background: 'linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)',
        borderRadius: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          justifyContent: 'space-between', 
          gap: isMobile ? '10px' : '12px', 
          flexWrap: 'wrap',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px' }}>学习中心</h2>
            <div style={{ marginTop: '4px', fontSize: isMobile ? '11px' : '12px', opacity: 0.8 }}>挑选课程开始学习，系统将实时记录你的学习进度</div>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '8px' : '10px',
            width: isMobile ? '100%' : 'auto',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索课程标题"
              style={{
                padding: isMobile ? '10px 12px' : '8px 12px',
                background: '#fff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                width: isMobile ? '100%' : '200px',
                fontSize: isMobile ? '16px' : '14px'
              }}
            />
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: isMobile ? '10px 14px' : '8px 14px',
                background: '#f3f4f6',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '14px',
                width: isMobile ? '100%' : 'auto'
              }}
            >返回首页</button>
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? '8px' : '10px', 
        marginBottom: isMobile ? '15px' : '18px' 
      }}>
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
                  padding: isMobile ? '8px 14px' : '6px 12px',
                  background: selectedCategory === category 
                    ? 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)' 
                    : 'rgba(0,0,0,0.04)',
                  color: selectedCategory === category ? '#fff' : '#111827',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: isMobile ? '20px' : '16px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '12px',
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
                padding: isMobile ? '6px 12px' : '4px 10px',
                background: statusFilter === (item.key as any) ? 'rgba(37,99,235,0.15)' : 'rgba(0,0,0,0.05)',
                color: '#111827',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: isMobile ? '16px' : '12px',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '12px'
              }}
            >{item.label}</button>
          ))}
        </div>
      </div>

      {/* 文章列表 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: isMobile ? '12px' : '15px'
      }}>
        {filteredArticles.map(article => (
          <div
            key={article.id}
            style={{
              background: '#ffffff',
              padding: isMobile ? '14px' : '16px',
              borderRadius: isMobile ? '12px' : '14px',
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
              <h3 style={{ 
                margin: 0, 
                fontSize: isMobile ? '15px' : '16px', 
                flex: 1, 
                lineHeight: '1.4' 
              }}>{article.title}</h3>
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