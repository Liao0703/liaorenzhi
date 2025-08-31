import React, { useState, useEffect } from 'react';
import { learningRecordAPI, articleAPI } from '../config/api';
import * as XLSX from 'xlsx';

// 添加CSS动画
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .article-records-container {
    animation: fadeIn 0.5s ease-out;
  }
  
  .article-item {
    animation: slideIn 0.3s ease-out;
  }
`;

// 添加样式到页面
if (!document.getElementById('article-records-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.id = 'article-records-styles';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

interface Article {
  id: number;
  title: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface LearningRecord {
  id: number;
  userId: number;
  username: string;
  name: string;
  employee_id?: string;
  articleId: string;
  articleTitle: string;
  score?: number;
  completionTime: string;
  studyDuration: number;
  quizCompleted: boolean;
  createdAt: string;
  department?: string;
  team?: string;
  job_type?: string;
  status: string;
}

interface ArticleLearningRecordsProps {
  currentUser: any;
}

const ArticleLearningRecords: React.FC<ArticleLearningRecordsProps> = ({ currentUser: _currentUser }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // 模拟文章数据
  const mockArticles: Article[] = [
    { id: 1, title: '安全操作规程学习', category: '安全教育', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: 2, title: '应急处理流程', category: '应急管理', created_at: '2024-01-02', updated_at: '2024-01-02' },
    { id: 3, title: '设备维护手册', category: '技术规范', created_at: '2024-01-03', updated_at: '2024-01-03' },
    { id: 4, title: '岗位职责与要求', category: '规章制度', created_at: '2024-01-04', updated_at: '2024-01-04' },
  ];

  // 模拟学习记录数据
  const mockLearningRecords: { [key: number]: LearningRecord[] } = {
    1: [
      {
        id: 1,
        userId: 1,
        username: 'user001',
        name: '张三',
        employee_id: '10001',
        articleId: '1',
        articleTitle: '安全操作规程学习',
        score: 85,
        completionTime: '2024-01-15 14:30:00',
        studyDuration: 45,
        quizCompleted: true,
        createdAt: '2024-01-15 14:30:00',
        department: '机务段',
        team: 'A班组',
        job_type: '司机',
        status: 'completed'
      },
      {
        id: 3,
        userId: 3,
        username: 'user003',
        name: '王五',
        employee_id: '10003',
        articleId: '1',
        articleTitle: '安全操作规程学习',
        completionTime: '2024-01-14 16:45:00',
        studyDuration: 25,
        quizCompleted: false,
        createdAt: '2024-01-14 16:45:00',
        department: '工务段',
        team: 'C班组',
        job_type: '线路工',
        status: 'incomplete'
      },
      {
        id: 6,
        userId: 5,
        username: 'user005',
        name: '孙七',
        employee_id: '10005',
        articleId: '1',
        articleTitle: '安全操作规程学习',
        score: 92,
        completionTime: '2024-01-16 10:20:00',
        studyDuration: 38,
        quizCompleted: true,
        createdAt: '2024-01-16 10:20:00',
        department: '车务段',
        team: 'E班组',
        job_type: '调度员',
        status: 'completed'
      }
    ],
    2: [
      {
        id: 2,
        userId: 2,
        username: 'user002',
        name: '李四',
        employee_id: '10002',
        articleId: '2',
        articleTitle: '应急处理流程',
        score: 92,
        completionTime: '2024-01-15 10:15:00',
        studyDuration: 38,
        quizCompleted: true,
        createdAt: '2024-01-15 10:15:00',
        department: '车务段',
        team: 'B班组',
        job_type: '调度员',
        status: 'completed'
      },
      {
        id: 5,
        userId: 4,
        username: 'user004',
        name: '赵六',
        employee_id: '10004',
        articleId: '2',
        articleTitle: '应急处理流程',
        score: 88,
        completionTime: '2024-01-13 15:30:00',
        studyDuration: 42,
        quizCompleted: true,
        createdAt: '2024-01-13 15:30:00',
        department: '电务段',
        team: 'D班组',
        job_type: '信号工',
        status: 'completed'
      }
    ],
    3: [
      {
        id: 4,
        userId: 1,
        username: 'user001',
        name: '张三',
        employee_id: '10001',
        articleId: '3',
        articleTitle: '设备维护手册',
        score: 78,
        completionTime: '2024-01-14 09:20:00',
        studyDuration: 52,
        quizCompleted: true,
        createdAt: '2024-01-14 09:20:00',
        department: '机务段',
        team: 'A班组',
        job_type: '司机',
        status: 'completed'
      }
    ]
  };

  // 加载文章列表
  const loadArticles = async () => {
    try {
      const response = await articleAPI.getAll();
      if (response.success && response.data) {
        setArticles(response.data);
      } else {
        // 使用模拟数据
        setArticles(mockArticles);
      }
    } catch (error) {
      console.error('加载文章列表失败:', error);
      setArticles(mockArticles);
    }
  };

  // 加载文章的学习记录
  const loadArticleLearningRecords = async (articleId: number) => {
    setLoading(true);
    try {
      const response = await learningRecordAPI.getByArticleId(articleId.toString());
      if (response.success && response.data) {
        setLearningRecords(response.data);
      } else {
        // 使用模拟数据
        setLearningRecords(mockLearningRecords[articleId] || []);
      }
    } catch (error) {
      console.error('加载文章学习记录失败:', error);
      setLearningRecords(mockLearningRecords[articleId] || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  // 监听窗口大小用于响应式布局
  useEffect(() => {
    const update = () => setIsSmallScreen(window.innerWidth <= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 选择文章
  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    loadArticleLearningRecords(article.id);
  };

  // 过滤文章列表
  const filteredArticles = articles.filter(article => {
    if (!articleSearchTerm) return true;
    return article.title.toLowerCase().includes(articleSearchTerm.toLowerCase()) ||
           article.category.toLowerCase().includes(articleSearchTerm.toLowerCase());
  });

  // 过滤学习记录
  const filteredRecords = learningRecords.filter(record => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && record.quizCompleted) ||
      (statusFilter === 'incomplete' && !record.quizCompleted);
    
    const matchesSearch = !searchTerm || 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.job_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // 获取统计信息
  const getStats = () => {
    const total = learningRecords.length;
    const completed = learningRecords.filter(r => r.quizCompleted).length;
    const avgScore = learningRecords.filter(r => r.score).reduce((sum, r) => sum + (r.score || 0), 0) / 
                    learningRecords.filter(r => r.score).length || 0;
    const totalStudyTime = learningRecords.reduce((sum, r) => sum + r.studyDuration, 0);

    return { total, completed, avgScore: Math.round(avgScore), totalStudyTime };
  };

  const stats = selectedArticle ? getStats() : null;

  // 导出Excel功能
  const exportToExcel = () => {
    if (!selectedArticle || filteredRecords.length === 0) {
      alert('请先选择文章并确保有学习记录数据');
      return;
    }

    try {
      // 统计数据
      const stats = getStats();
      
      // 准备导出的详细数据
      const exportData = filteredRecords.map((record, index) => ({
        '序号': index + 1,
        '文章标题': selectedArticle.title,
        '文章分类': selectedArticle.category,
        '工号': record.employee_id || '-',
        '姓名': record.name,
        '用户名': record.username,
        '部门': record.department || '-',
        '班组': record.team || '-',
        '工种': record.job_type || '-',
        '学习时长(分钟)': record.studyDuration,
        '测验分数': record.score || 0,
        '完成状态': record.quizCompleted ? '已完成' : '未完成',
        '开始时间': record.createdAt ? new Date(record.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-',
        '完成时间': new Date(record.completionTime).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 创建详细记录工作表
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 设置列宽
      const colWidths = [
        { wch: 6 },   // 序号
        { wch: 25 },  // 文章标题
        { wch: 12 },  // 文章分类
        { wch: 12 },  // 工号
        { wch: 10 },  // 姓名
        { wch: 15 },  // 用户名
        { wch: 12 },  // 部门
        { wch: 12 },  // 班组
        { wch: 15 },  // 工种
        { wch: 15 },  // 学习时长
        { wch: 12 },  // 测验分数
        { wch: 12 },  // 完成状态
        { wch: 20 },  // 开始时间
        { wch: 20 }   // 完成时间
      ];
      ws['!cols'] = colWidths;

      // 添加详细记录工作表
      XLSX.utils.book_append_sheet(wb, ws, '详细记录');

      // 创建统计摘要工作表
      const summaryData = [
        { '项目': '文章标题', '数值': selectedArticle.title },
        { '项目': '文章分类', '数值': selectedArticle.category },
        { '项目': '总学习人数', '数值': stats.total },
        { '项目': '已完成人数', '数值': stats.completed },
        { '项目': '未完成人数', '数值': stats.total - stats.completed },
        { '项目': '完成率', '数值': `${((stats.completed / stats.total) * 100).toFixed(1)}%` },
        { '项目': '平均分数', '数值': stats.avgScore || 0 },
        { '项目': '总学习时长(小时)', '数值': Math.round(stats.totalStudyTime / 60 * 100) / 100 },
        { '项目': '平均学习时长(分钟)', '数值': Math.round(stats.totalStudyTime / stats.total) || 0 },
        { '项目': '导出时间', '数值': new Date().toLocaleString('zh-CN') }
      ];

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
      
      // 添加统计摘要工作表
      XLSX.utils.book_append_sheet(wb, summaryWs, '统计摘要');

      // 生成文件名
      const now = new Date();
      const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
      const filename = `${selectedArticle.title.replace(/[<>:"/\\|?*]/g, '_')}-学习记录-${dateStr}-${timeStr}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, filename);

      // 显示成功消息
      const message = `📊 导出成功！\n\n文件名：${filename}\n记录数量：${filteredRecords.length} 条\n完成率：${((stats.completed / stats.total) * 100).toFixed(1)}%\n\n包含工作表：\n• 详细记录\n• 统计摘要`;
      alert(message);
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert(`❌ 导出失败！\n\n错误信息：${error instanceof Error ? error.message : '未知错误'}\n\n请检查浏览器是否支持文件下载功能`);
    }
  };

  return (
    <div 
      className="article-records-container"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
        padding: '24px',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        color: '#2d3748',
        minHeight: '600px'
      }}>
      {/* 标题栏（统一为白底黑字） */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        padding: '20px 24px',
        background: '#fff',
        borderRadius: '16px',
        color: '#111827',
        border: '1px solid #eef0f4',
        boxShadow: '0 6px 24px rgba(17, 24, 39, 0.06)'
      }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#f3f4f6',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>📊</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#111827' }}>文章学习记录查询</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8, color: '#374151' }}>
              选择文章查看详细学习记录和统计数据
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={exportToExcel}
            disabled={!selectedArticle || loading || filteredRecords.length === 0}
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: !selectedArticle || loading || filteredRecords.length === 0 ? '#9ca3af' : '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              cursor: !selectedArticle || loading || filteredRecords.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transform: 'translateY(0)'
            }}
            onMouseOver={(e) => {
              if (selectedArticle && !loading && filteredRecords.length > 0) {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.color = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (selectedArticle && !loading && filteredRecords.length > 0) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#111827';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            导出Excel
          </button>
        </div>

      </div>

      {/* 两栏布局（小屏改为单列） */}
      <div style={{ display: 'grid', gridTemplateColumns: isSmallScreen ? '1fr' : 'minmax(300px, 360px) 1fr', gap: '24px' }}>
        {/* 左侧：文章选择器 */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          height: 'fit-content',
          width: '100%',
          maxWidth: isSmallScreen ? '100%' : '360px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e2e8f0'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              color: '#fff',
              fontSize: '16px'
            }}>📚</div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              选择文章
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              共 {articles.length} 篇文章
            </div>
          </div>
          
          {/* 文章搜索框 */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="搜索文章标题或分类... (回车选择第一个结果)"
              value={articleSearchTerm}
              onChange={e => setArticleSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredArticles.length > 0) {
                  handleArticleSelect(filteredArticles[0]);
                  setArticleSearchTerm('');
                }
              }}
              style={{
                width: 'calc(100% - 0px)', // 确保与右侧边框对齐
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#374151',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            />
            {articleSearchTerm && (
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '4px',
                textAlign: 'center'
              }}>
                找到 {filteredArticles.length} 篇文章
              </div>
            )}
          </div>
          
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {filteredArticles.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontSize: '14px' }}>没有找到匹配的文章</div>
              </div>
            ) : (
              filteredArticles.map(article => (
              <div
                key={article.id}
                className="article-item"
                onClick={() => handleArticleSelect(article)}
                style={{
                  padding: '16px',
                  margin: '0 0 12px 0',
                  background: selectedArticle?.id === article.id 
                    ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' 
                    : '#ffffff',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: selectedArticle?.id === article.id 
                    ? '2px solid #3b82f6' 
                    : '1px solid #e2e8f0',
                  boxShadow: selectedArticle?.id === article.id
                    ? '0 4px 12px rgba(59, 130, 246, 0.15)'
                    : '0 2px 4px rgba(0, 0, 0, 0.05)',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  if (selectedArticle?.id !== article.id) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedArticle?.id !== article.id) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }
                }}
              >
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: selectedArticle?.id === article.id ? '#1d4ed8' : '#1e293b'
                }}>
                  {article.title}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    background: selectedArticle?.id === article.id 
                      ? 'rgba(59, 130, 246, 0.1)' 
                      : 'rgba(148, 163, 184, 0.1)',
                    color: selectedArticle?.id === article.id ? '#1d4ed8' : '#64748b',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}>
                    {article.category}
                  </span>
                  {selectedArticle?.id === article.id && (
                    <span style={{ color: '#3b82f6', fontSize: '14px' }}>✓</span>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧：学习记录详情 */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          {!selectedArticle ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              color: '#64748b'
            }}>
              <div style={{ 
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                fontSize: '48px'
              }}>📊</div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                margin: '0 0 8px 0',
                color: '#374151'
              }}>
                选择文章查看学习记录
              </h3>
              <p style={{ 
                fontSize: '16px', 
                margin: 0,
                opacity: 0.8
              }}>
                从左侧选择一篇文章，查看详细的学习数据和统计信息
              </p>
            </div>
          ) : (
            <>
              {/* 选中文章信息 */}
              <div style={{ 
                marginBottom: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '12px',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px'
                  }}>📖</div>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0c4a6e' }}>
                    《{selectedArticle.title}》
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#075985', opacity: 0.9 }}>
                  学习记录统计数据
                </p>
              </div>
                
              {stats && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    background: '#ffffff',
                    padding: '18px 16px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                    borderLeft: '4px solid #3b82f6'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8' }}>{stats.total}</div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginTop: '4px' }}>学习人数</div>
                  </div>
                  <div style={{
                    background: '#ffffff',
                    padding: '18px 16px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                    borderLeft: '4px solid #10b981'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d' }}>{stats.completed}</div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginTop: '4px' }}>已完成</div>
                  </div>
                  <div style={{
                    background: '#ffffff',
                    padding: '18px 16px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                    borderLeft: '4px solid #f59e0b'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>{stats.avgScore}</div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginTop: '4px' }}>平均分</div>
                  </div>
                  <div style={{
                    background: '#ffffff',
                    padding: '18px 16px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                    borderLeft: '4px solid #ec4899'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#be185d' }}>{Math.round(stats.totalStudyTime / 60)}h</div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginTop: '4px' }}>总时长</div>
                  </div>
                </div>
              )}

              {/* 筛选器 */}
              <div style={{ 
                padding: '16px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '200px 200px 1fr', 
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      完成状态
                    </label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        color: '#374151',
                        fontSize: '14px',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="all">全部状态</option>
                      <option value="completed">已完成</option>
                      <option value="incomplete">未完成</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      搜索用户
                    </label>
                    <input
                      type="text"
                      placeholder="姓名、部门或工种..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        color: '#374151',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div style={{ 
                    textAlign: 'right',
                    fontSize: '14px', 
                    color: '#64748b',
                    fontWeight: 500
                  }}>
                    <div style={{
                      padding: '8px 16px',
                      background: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'inline-block'
                    }}>
                      显示 <span style={{ color: '#3b82f6', fontWeight: 600 }}>{filteredRecords.length}</span> / {learningRecords.length} 条记录
                    </div>
                  </div>
                </div>
              </div>

              {/* 学习记录表格 */}
              <div style={{ 
                background: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderBottom: '2px solid #e2e8f0'
                      }}>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'left', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '120px'
                        }}>👤 姓名</th>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'left', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '80px'
                        }}>🏷️ 工号</th>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'left', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '100px'
                        }}>🏢 部门</th>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'left', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '90px'
                        }}>💼 工种</th>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'center', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '80px'
                        }}>⏱️ 时长</th>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'center', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '80px'
                        }}>📊 分数</th>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'center', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '80px'
                        }}>✅ 状态</th>
                        <th style={{ 
                          padding: '16px 12px', 
                          textAlign: 'left', 
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          minWidth: '110px'
                        }}>📅 完成时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} style={{ 
                            padding: '60px 20px', 
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: '16px'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid #e2e8f0',
                                borderTop: '3px solid #3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                              加载中...
                            </div>
                          </td>
                        </tr>
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ 
                            padding: '60px 20px', 
                            textAlign: 'center',
                            color: '#64748b'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <div style={{ fontSize: '48px', opacity: 0.5 }}>📋</div>
                              <div style={{ fontSize: '16px', fontWeight: 500 }}>暂无学习记录</div>
                              <div style={{ fontSize: '14px', opacity: 0.8 }}>该文章还没有用户学习记录</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((record, index) => (
                          <tr 
                            key={record.id} 
                            style={{ 
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'all 0.2s ease',
                              background: index % 2 === 0 ? '#ffffff' : '#fafbfc'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f9ff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc';
                            }}
                          >
                            <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px' 
                              }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}>
                                  {record.name.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{record.name}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>@{record.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                              <code style={{ 
                                background: '#f1f5f9', 
                                color: '#3b82f6',
                                padding: '4px 8px', 
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: '1px solid #e2e8f0'
                              }}>
                                {record.employee_id || '-'}
                              </code>
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                              <div style={{ color: '#374151', fontWeight: 500 }}>{record.department || '-'}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{record.team || ''}</div>
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                              <span style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                color: '#0369a1',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                border: '1px solid #bae6fd'
                              }}>
                                {record.job_type || '-'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '14px', textAlign: 'center' }}>
                              <div style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                color: '#92400e',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: '1px solid #fbbf24',
                                display: 'inline-block'
                              }}>
                                {record.studyDuration}分
                              </div>
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '14px', textAlign: 'center' }}>
                              {record.score ? (
                                <span style={{
                                  background: record.score >= 80 
                                    ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                                    : record.score >= 60 
                                    ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' 
                                    : 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                                  color: record.score >= 80 ? '#15803d' : record.score >= 60 ? '#92400e' : '#dc2626',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  border: record.score >= 80 
                                    ? '1px solid #86efac' 
                                    : record.score >= 60 
                                    ? '1px solid #fbbf24' 
                                    : '1px solid #f87171',
                                  display: 'inline-block'
                                }}>
                                  {record.score}分
                                </span>
                              ) : (
                                <span style={{ 
                                  color: '#94a3b8', 
                                  fontSize: '12px',
                                  fontStyle: 'italic'
                                }}>未完成</span>
                              )}
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '14px', textAlign: 'center' }}>
                              <span style={{
                                background: record.quizCompleted 
                                  ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                                  : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                color: record.quizCompleted ? '#15803d' : '#64748b',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: record.quizCompleted ? '1px solid #86efac' : '1px solid #cbd5e1',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {record.quizCompleted ? '✅ 完成' : '⏳ 未完成'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', fontSize: '12px', color: '#64748b' }}>
                              {new Date(record.completionTime).toLocaleDateString('zh-CN')}
                              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                {new Date(record.completionTime).toLocaleTimeString('zh-CN', { hour12: false })}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleLearningRecords;
