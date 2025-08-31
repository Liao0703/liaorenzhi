import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

import { getAllArticles, updateArticle, addArticle, deleteArticle, syncFromCloud, syncToCloud } from './articleData';
import type { ArticleData } from './articleData';
import { articleAPI } from './config/api';
import { JOB_TYPE_GROUPS, getAllJobTypes } from './config/jobTypes';
import type { JobType } from './config/jobTypes';
// 本地清空逻辑已切换到云端，移除本地导入
import { photoAPI } from './config/api';

// 照片统计子组件（使用云数据库）
const PhotoStatsPanel: React.FC = () => {
  const [stats, setStats] = React.useState({ total: 0, today: 0 });

  React.useEffect(() => {
    (async () => {
      const res = await photoAPI.list();
      if (res && res.success) {
        const list = res.data || [];
        const total = list.length;
        const todayStr = new Date().toDateString();
        const today = list.filter((p: any) => new Date(p.created_at).toDateString() === todayStr).length;
        setStats({ total, today });
      }
    })();
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#409eff' }}>{stats.total}</div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>总照片数</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#67c23a' }}>{stats.today}</div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>今日照片数</div>
      </div>
    </div>
  );
};

// 照片列表子组件（使用云数据库）
const PhotoListPanel: React.FC = () => {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState('');
  const [start, setStart] = React.useState<string>('');
  const [end, setEnd] = React.useState<string>('');

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await photoAPI.list({ page, limit, q, start, end });
      if (res && res.success) {
        const data = res.data?.items || res.data || [];
        setItems(data);
        setTotal(res.data?.total ?? data.length);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, start, end]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleClearAll = async () => {
    if (!window.confirm('确定要清空所有照片吗？此操作不可恢复！')) return;
    try {
      const res = await photoAPI.list({ page: 1, limit: 1000, q, start, end });
      if (res && res.success) {
        const list = res.data?.items || res.data || [];
        for (const item of list) {
          try { await photoAPI.delete(item.id); } catch {}
        }
        await refresh();
        alert('云端照片已清空');
      } else {
        alert('清空失败：无法获取列表');
      }
    } catch (e) {
      alert('清空失败');
    }
  };

  const hasNext = page * limit < total;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>加载中...</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, fontSize: '16px' }}>最近照片</h4>
          <button
            onClick={handleClearAll}
            style={{ padding: '6px 12px', background: 'linear-gradient(90deg,#f56c6c 60%,#fab6b6 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >清空所有照片</button>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>暂无照片数据</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ margin: 0, fontSize: '16px' }}>最近照片</h4>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索用户/文章/文件名" style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <button onClick={()=>{ setPage(1); refresh(); }} style={{ padding: '6px 12px', background: '#111827', color: '#fff', border: '1px solid #111827', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>查询</button>
          <button
            onClick={async ()=>{
              const res = await photoAPI.exportCsv({ q, start, end });
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `photos_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ padding: '6px 12px', background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >导出CSV</button>
          <button
          onClick={handleClearAll}
          style={{ padding: '6px 12px', background: 'linear-gradient(90deg,#f56c6c 60%,#fab6b6 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
        >清空所有照片</button>
        </div>
      </div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.slice(0, 10).map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', gap: '15px' }}>
              <div style={{ width: 60, height: 45, borderRadius: 4, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>预览</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{p.article_title || '未知文章'}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{new Date(p.created_at).toLocaleString('zh-CN')}</div>
                {p.user_name && (
                  <div style={{ fontSize: '12px', opacity: 0.6 }}>用户：{p.user_name}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>共 {total} 条</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: page===1? 'not-allowed':'pointer' }}>上一页</button>
          <div style={{ fontSize: 12, padding: '6px 8px' }}>第 {page} 页</div>
          <button disabled={!hasNext} onClick={()=>setPage(p=>p+1)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: !hasNext? 'not-allowed':'pointer' }}>下一页</button>
        </div>
      </div>
    </div>
  );
};
import { getSettings, updateSettings } from './settingsStorage';
import { getAllSystemData, backupData, clearAllData } from './dataManager';
import { getLearningStorageData, getStorageUsage } from './storageViewer';
import { STORAGE_CONFIG } from './fileUploadService';
import ServerConfigPanel from './OSSConfigPanel';
import ServerStoragePanel from './HybridStoragePanel';
import FileUploadModal from './FileUploadModal';
import type { FileInfo } from './FileUploadModal';
import ArticleLearningRecords from './components/ArticleLearningRecords';
import { overviewStatisticsService } from './services/overviewStatisticsService';
import type { OverviewData } from './services/overviewStatisticsService';

// 动态导入用户管理组件
const UserManagement = React.lazy(() => import('./components/UserManagement'));

interface AdminPanelProps {
  user: any;
}

interface UserRecord {
  id: number;
  name: string;
  username: string;
  employeeId: string;
  unit: string;
  department: string;
  team: string;
  jobType: string;
  completedArticles: number;
  totalStudyTime: number;
  averageScore: number;
  lastStudyTime: string;
  status: 'active' | 'inactive';
}





const AdminPanel: React.FC<AdminPanelProps> = ({ user: _user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'user-management' | 'article-records' | 'articles' | 'statistics' | 'photos' | 'settings'>('overview');
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // 概览数据状态
  const [overviewData, setOverviewData] = useState<OverviewData>({
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalArticles: 0,
      averageCompletionRate: 0,
      totalStudyTime: 0,
      averageScore: 0
    },
    recentActivities: [],
    leaderboard: [],
    departmentStats: [],
    jobTypeStats: [],
    learningTrend: [],
    articleStats: []
  });
  const [loadingOverview, setLoadingOverview] = useState(false);
  // 最近活动分页
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesLimit] = useState(10);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activitiesHasNext, setActivitiesHasNext] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 根据 URL 查询参数 tab 同步选中的标签
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as typeof activeTab | null;
    const allowedTabs = new Set(['overview','users','user-management','article-records','articles','statistics','photos','settings']);
    if (tabParam && allowedTabs.has(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  
  // 获取概览数据
  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    }
    if (activeTab === 'statistics') {
      (async () => {
        try {
          const data = await overviewStatisticsService.getOverviewStats();
          setStatsKpi({
            averageCompletionRate: data.stats.averageCompletionRate,
            averageScore: data.stats.averageScore,
            averageStudyMinutes: Math.round((data.stats.totalStudyTime * 60) / Math.max(data.stats.totalUsers || 1, 1)),
            activeRatio: data.stats.totalUsers ? Math.round((data.stats.activeUsers / data.stats.totalUsers) * 100) : 0
          });
          // 分类学习按文章类别聚合
          const categoryMap: Record<string, number> = {};
          (data.articleStats || []).forEach(a => {
            const key = a.category || '未分类';
            categoryMap[key] = (categoryMap[key] || 0) + (a.learnersCount || 0);
          });
          setCategoryStats(Object.entries(categoryMap).map(([category, learners]) => ({ category, learners })));
        } catch (e) {
          console.error('加载统计分析失败', e);
        }
      })();
    }
  }, [activeTab]);
  
  const loadOverviewData = async () => {
    setLoadingOverview(true);
    try {
      const data = await overviewStatisticsService.getOverviewStats();
      setOverviewData(data);
      // 初始化分页活动
      const paged = await overviewStatisticsService.getRecentActivities(1, activitiesLimit);
      setOverviewData(prev => ({ ...prev, recentActivities: paged.items }));
      setActivitiesPage(paged.page);
      setActivitiesTotal(paged.total);
      setActivitiesHasNext(paged.hasNext);
    } catch (error) {
      console.error('加载概览数据失败:', error);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadActivitiesPage = async (page: number) => {
    try {
      const paged = await overviewStatisticsService.getRecentActivities(page, activitiesLimit);
      setOverviewData(prev => ({ ...prev, recentActivities: paged.items }));
      setActivitiesPage(paged.page);
      setActivitiesTotal(paged.total);
      setActivitiesHasNext(paged.hasNext);
    } catch (e) {
      console.error('加载最近活动失败', e);
    }
  };
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [showStoragePanel, setShowStoragePanel] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // 筛选状态
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('');

  // 单位选项
  const units = ['兴隆场车站'];
  
  // 部门选项
  const departments = ['团结村车站','白市驿车站','陶家场线路所','铜罐驿车站','石场车站','中梁山','跳蹬车站','珞璜车站','小南海车站','伏牛溪车站','茄子溪车站','大渡口车站','重庆南车站'];
  
  // 班组选项
  const teams = ['运转一班', '运转二班', '运转三班', '运转四班'];
  
  // 工种选项
  const jobTypes = ['车站值班员', '助理值班员（内勤）', '助理值班员（外勤）', '连结员', '调车长', '列尾作业员', '站调', '车号员'];

  // 模拟用户学习记录
  const [userRecords, setUserRecords] = useState<UserRecord[]>([]);

  // 加载"用户学习总览"真实数据
  const loadUsersOverview = async () => {
    try {
      const data = await overviewStatisticsService.getUsersOverview({
        unit: unitFilter || undefined,
        department: departmentFilter || undefined,
        team: teamFilter || undefined,
        jobType: jobTypeFilter || undefined,
      });
      const mapped: UserRecord[] = data.map((r: any) => ({
        id: r.id,
        name: r.name || r.username,
        username: r.username,
        employeeId: r.employeeId || String(r.id),
        unit: r.unit || '',
        department: r.department || '',
        team: r.team || '',
        jobType: r.jobType || '',
        completedArticles: r.completedArticles || 0,
        totalStudyTime: r.totalStudyTime || 0,
        averageScore: r.averageScore || 0,
        lastStudyTime: r.lastStudyTime || '',
        status: (r.status === 'active' ? 'active' : 'inactive')
      }));
      setUserRecords(mapped);
    } catch (e) {
      console.error('加载用户学习总览失败', e);
      setUserRecords([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsersOverview();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, unitFilter, departmentFilter, teamFilter, jobTypeFilter]);

  // 文章内容管理 - 使用新的数据存储系统
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [editArticle, setEditArticle] = useState<ArticleData | null>(null);

  // 从API获取文章列表
  const loadArticlesFromAPI = async () => {
    try {
      setArticlesLoading(true);
      console.log('管理员面板：从API获取文章列表...');
      const response = await articleAPI.getAll();
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log('管理员面板：API获取文章列表成功:', response.data.length, '篇文章');
        
        // 转换服务器数据格式为前端格式
        const formattedArticles: ArticleData[] = response.data.map((serverArticle: any) => ({
          id: serverArticle.id?.toString(),
          title: serverArticle.title || '未命名文章',
          content: serverArticle.content || '',
          category: serverArticle.category || '未分类',
          requiredReadingTime: serverArticle.required_reading_time || 30,
          questions: [], // 默认空数组，编辑时再从本地获取
          fileType: serverArticle.file_type || 'none',
          fileUrl: serverArticle.file_url,
          fileName: serverArticle.file_name,
          fileId: serverArticle.file_id,
          storageType: serverArticle.storage_type || 'local'
        }));
        
        setArticles(formattedArticles);
        console.log('管理员面板：文章列表格式化完成:', formattedArticles);
      } else {
        throw new Error(response.error || '获取文章列表失败');
      }
    } catch (error) {
      console.warn('管理员面板：API获取文章列表失败，使用本地数据:', error);
      const localArticles = getAllArticles();
      setArticles(localArticles);
    } finally {
      setArticlesLoading(false);
    }
  };

  // 组件加载时获取文章列表
  useEffect(() => {
    loadArticlesFromAPI();
  }, []);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');
  const [cameraInterval, setCameraInterval] = useState(getSettings().cameraInterval); // 摄像头拍照间隔（秒）
  const [enableRandomCapture, setEnableRandomCapture] = useState(getSettings().enableRandomCapture); // 启用随机拍摄
  const [randomCaptureCount, setRandomCaptureCount] = useState(getSettings().randomCaptureCount); // 随机拍摄数量
  const [enableAntiCheating, setEnableAntiCheating] = useState(getSettings().enableAntiCheating); // 启用防代学功能

  // 文章分类
  const categories = ['安全规程', '设备维护', '应急处理', '信号系统', '调度规范', '作业标准'];

  // 轻量卡片与子卡片通用样式（对齐新概览风格）
  const lightCard: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #eef0f4',
    borderRadius: 12,
    boxShadow: '0 6px 24px rgba(17, 24, 39, 0.06)'
  };
  const subCard: React.CSSProperties = {
    background: '#f8fafc',
    border: '1px solid #eef2f7',
    borderRadius: 8
  };

  // 格式化字节数（暂时未使用）
  // const formatBytes = (bytes: number): string => {
  //   if (bytes === 0) return '0 B';
  //   const k = 1024;
  //   const sizes = ['B', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  // 新增/编辑表单初始值
  const emptyArticle: ArticleData = { 
    id: '', 
    title: '', 
    category: categories[0], 
    content: '', 
    requiredReadingTime: 30,
    questions: []
  };

  // 打开添加表单
  const handleAdd = () => {
    setEditArticle(emptyArticle);
    setFormType('add');
    setShowForm(true);
  };

  // 处理文件上传
  const handleFileUpload = (fileInfo: FileInfo) => {
    // 从文件名生成合适的标题
    let title = fileInfo.name.replace(/\.[^/.]+$/, ''); // 移除文件扩展名
    
    // 如果标题为空或只包含特殊字符，使用默认标题
    if (!title || title.trim() === '') {
      title = `文档资料_${new Date().toLocaleString()}`;
    }
    
    console.log('文件上传处理:', {
      originalName: fileInfo.name,
      generatedTitle: title,
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType
    });
    
    // 使用文件信息创建新文章
    const newArticle = {
      ...emptyArticle,
      title: title,
      content: `这是一个文件型文章，支持在线阅读。\n\n📄 原始文件名: ${fileInfo.name}\n📁 文件类型: ${fileInfo.fileType}\n📊 文件大小: ${fileInfo.size ? Math.round(fileInfo.size / 1024) + 'KB' : '未知'}\n\n点击"开始阅读"按钮即可在线查看文档内容。`,
      fileType: fileInfo.fileType as 'pdf' | 'word' | 'none',
      fileUrl: fileInfo.fileUrl,
      fileName: fileInfo.fileName,
      fileId: fileInfo.fileId,
      storageType: 'hybrid' as const, // 统一使用云服务器存储
      questions: []
    };
    setEditArticle(newArticle);
    setFormType('add');
    setShowForm(true);
    
    // 显示提示信息
    alert(`📄 文件上传成功！\n\n标题已设置为: "${title}"\n\n请在接下来的表单中：\n1. 确认或修改文章标题和分类\n2. 设置要求阅读时间\n3. 添加考试题目（推荐）\n4. 点击保存完成创建`);
  };

  // 导出学习记录到Excel
  const exportLearningRecordsToExcel = () => {
    try {
      // 应用筛选条件
      const filteredUsers = userRecords.filter(user => {
        return (!unitFilter || user.unit === unitFilter) &&
               (!departmentFilter || user.department === departmentFilter) &&
               (!teamFilter || user.team === teamFilter) &&
               (!jobTypeFilter || user.jobType === jobTypeFilter);
      });

      // 准备导出的数据
      const exportData = filteredUsers.map((user, index) => ({
        '序号': index + 1,
        '工号': user.employeeId,
        '姓名': user.name,
        '用户名': user.username,
        '单位': user.unit,
        '部门': user.department,
        '班组': user.team,
        '工种': user.jobType,
        '完成文章数': user.completedArticles,
        '学习时长(分钟)': user.totalStudyTime,
        '平均成绩': user.averageScore,
        '最后学习时间': user.lastStudyTime,
        '状态': user.status === 'active' ? '活跃' : '非活跃'
      }));

      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 设置列宽
      const colWidths = [
        { wch: 6 },   // 序号
        { wch: 10 },  // 工号
        { wch: 10 },  // 姓名
        { wch: 12 },  // 用户名
        { wch: 15 },  // 单位
        { wch: 12 },  // 部门
        { wch: 10 },  // 班组
        { wch: 15 },  // 工种
        { wch: 12 },  // 完成文章数
        { wch: 15 },  // 学习时长
        { wch: 10 },  // 平均成绩
        { wch: 16 },  // 最后学习时间
        { wch: 8 }    // 状态
      ];
      ws['!cols'] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '学习记录统计');

      // 生成文件名（包含当前时间）
      const now = new Date();
      const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
      const filename = `学习记录统计-${dateStr}-${timeStr}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, filename);

      alert(`已成功导出 ${filteredUsers.length} 条学习记录统计到 ${filename}`);
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出Excel失败，请重试');
    }
  };

  // 打开编辑表单
  const handleEdit = (article: ArticleData) => {
    setEditArticle(article);
    setFormType('edit');
    setShowForm(true);
  };

  // 删除文章
  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这篇文章吗？此操作将同时删除云端数据。')) {
      try {
        await deleteArticle(id);
        // 重新加载文章列表
        await loadArticlesFromAPI();
        // 显示成功提示
        const successMsg = document.createElement('div');
        successMsg.textContent = '✅ 文章删除成功';
        successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#67c23a;color:white;padding:10px 20px;border-radius:6px;z-index:10000;';
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
      } catch (error) {
        alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };

  // 提交表单
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArticle) return;
    if (!editArticle.title.trim()) {
      alert('标题不能为空');
      return;
    }

    // 验证题目数据完整性
    if (editArticle.questions && editArticle.questions.length > 0) {
      for (let i = 0; i < editArticle.questions.length; i++) {
        const question = editArticle.questions[i];
        if (!question.question.trim()) {
          alert(`题目 ${i + 1} 的内容不能为空`);
          return;
        }
        if (question.options.some(option => !option.trim())) {
          alert(`题目 ${i + 1} 的选项不能为空`);
          return;
        }
      }
    }

    try {
    if (formType === 'add') {
        await addArticle(editArticle);
    } else {
        await updateArticle(editArticle);
    }
      // 重新加载文章列表
      await loadArticlesFromAPI();
    setShowForm(false);
    setEditArticle(null);
      
      // 显示成功提示
      const successMsg = document.createElement('div');
      successMsg.textContent = `✅ 文章${formType === 'add' ? '添加' : '更新'}成功`;
      successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#67c23a;color:white;padding:10px 20px;border-radius:6px;z-index:10000;';
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
    } catch (error) {
      alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 统计数据 - 现在从云数据库获取
  // const stats = {
  //   totalUsers: userRecords.length,
  //   activeUsers: userRecords.filter(user => user.status === 'active').length,
  //   totalArticles: 15,
  //   totalStudyTime: Math.round(userRecords.reduce((total, user) => total + user.totalStudyTime, 0) / 60), // 转换为小时
  //   averageCompletionRate: Math.round(userRecords.reduce((total, user) => total + user.completedArticles, 0) / userRecords.length),
  //   averageScore: Math.round(userRecords.reduce((total, user) => total + user.averageScore, 0) / userRecords.length)
  // };

  // 统计分析页数据
  const [statsKpi, setStatsKpi] = useState({
    averageCompletionRate: 0,
    averageScore: 0,
    averageStudyMinutes: 0,
    activeRatio: 0
  });
  const [categoryStats, setCategoryStats] = useState<Array<{category:string; learners:number}>>([]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' }}>
      {/* 左侧导航栏 */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '240px',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        transition: 'width 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* 收缩按钮 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            right: '-15px',
            top: '20px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            zIndex: 1
          }}
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        {/* Logo区域 */}
        <div style={{
          padding: sidebarCollapsed ? '20px 10px' : '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          {!sidebarCollapsed && (
            <h2 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>兴站智训通</h2>
          )}
          {sidebarCollapsed && (
            <span style={{ color: '#fff', fontSize: '20px' }}>📚</span>
          )}
        </div>

        {/* 导航菜单 */}
        <nav style={{ 
          flex: 1, 
          padding: '10px 0', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {[
            { id: 'overview', icon: '📊', label: '概览' },
            { id: 'users', icon: '👥', label: '用户学习总览' },
            { id: 'user-management', icon: '🔑', label: '用户管理' },
            { id: 'article-records', icon: '📝', label: '学习记录查询' },
            { id: 'articles', icon: '📚', label: '文章管理' },
            { id: 'statistics', icon: '📈', label: '统计分析' },
            { id: 'photos', icon: '📷', label: '照片管理' },
            { id: 'settings', icon: '⚙️', label: '系统设置' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              style={{
                width: '100%',
                padding: sidebarCollapsed ? '12px' : '12px 20px',
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeTab === item.id ? '3px solid #409eff' : '3px solid transparent',
                color: activeTab === item.id ? '#409eff' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {sidebarCollapsed && activeTab === item.id && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  marginLeft: '10px',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}>
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* 底部返回按钮 */}
        <div style={{ 
          padding: sidebarCollapsed ? '10px' : '10px 20px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 'auto',
          flexShrink: 0
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            title="返回首页"
          >
            <span>🚪</span>
            {!sidebarCollapsed && <span>返回首页</span>}
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ 
        flex: 1,
        padding: isMobile ? '15px' : '20px',
        overflowY: 'auto',
        position: 'relative',
        background: '#f5f7fb',
        color: '#111827'
      }}>

      {/* 总览页面 */}
      {activeTab === 'overview' && (
        <div>
          {loadingOverview ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
              <div>加载中...</div>
            </div>
          ) : (
            <>
              {/* 统计卡片 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: isMobile ? '15px' : '20px',
                marginBottom: isMobile ? '20px' : '30px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>总用户数</h3>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{overviewData.stats.totalUsers}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    活跃用户：{overviewData.stats.activeUsers}
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  padding: '20px',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(240, 147, 251, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>文章总数</h3>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{overviewData.stats.totalArticles}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    平均完成率：{overviewData.stats.averageCompletionRate}%
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  padding: '20px',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(79, 172, 254, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>总学习时长</h3>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{overviewData.stats.totalStudyTime}h</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    平均成绩：{overviewData.stats.averageScore}分
                  </div>
                </div>
              </div>

              {/* 最近活动 */}
              <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '30px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>最近活动</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {overviewData.recentActivities.length > 0 ? (
                    overviewData.recentActivities.map((activity, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <span style={{ color: '#374151' }}>
                          {activity.userName ? `${activity.userName} · ${activity.description || ''}` : (activity.description || '')}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>
                          {overviewStatisticsService.formatDateTime(activity.activityTime)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                      暂无最近活动
                    </div>
                  )}
                </div>
                {/* 分页控件 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button
                    onClick={() => loadActivitiesPage(Math.max(activitiesPage - 1, 1))}
                    disabled={activitiesPage <= 1}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      background: activitiesPage <= 1 ? '#f3f4f6' : '#fff',
                      color: activitiesPage <= 1 ? '#9ca3af' : '#111827',
                      cursor: activitiesPage <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >上一页</button>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    第 {activitiesPage} 页 / 共 {Math.max(Math.ceil(activitiesTotal / activitiesLimit), 1)} 页
                  </div>
                  <button
                    onClick={() => loadActivitiesPage(activitiesPage + 1)}
                    disabled={!activitiesHasNext}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      background: !activitiesHasNext ? '#f3f4f6' : '#fff',
                      color: !activitiesHasNext ? '#9ca3af' : '#111827',
                      cursor: !activitiesHasNext ? 'not-allowed' : 'pointer'
                    }}
                  >下一页</button>
                </div>
              </div>

              {/* 学习排行榜 */}
              <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827' }}>学习排行榜</h3>
                {overviewData.leaderboard.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#374151' }}>排名</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#374151' }}>姓名</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#374151' }}>部门</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#374151' }}>工种</th>
                          <th style={{ padding: '12px', textAlign: 'center', color: '#374151' }}>完成文章</th>
                          <th style={{ padding: '12px', textAlign: 'center', color: '#374151' }}>学习时长</th>
                          <th style={{ padding: '12px', textAlign: 'center', color: '#374151' }}>平均成绩</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewData.leaderboard.map((user, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', color: '#111827' }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </td>
                            <td style={{ padding: '12px', color: '#111827', fontWeight: 500 }}>{user.userName}</td>
                            <td style={{ padding: '12px', color: '#6b7280' }}>{user.department || '-'}</td>
                            <td style={{ padding: '12px', color: '#6b7280' }}>{user.jobType || '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#111827' }}>
                              {user.completedCount}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#111827' }}>
                              {user.studyHours}h
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#111827' }}>
                              {user.averageScore}分
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                    暂无学习记录
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 用户学习总览页面 */}
      {activeTab === 'users' && (
        <div style={{ ...lightCard, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>👥 用户学习总览</h3>
            <button
              onClick={exportLearningRecordsToExcel}
              style={{
                padding: '8px 14px',
                background: '#111827',
                color: '#fff',
                border: '1px solid #111827',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(103, 194, 58, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(103, 194, 58, 0.3)';
              }}
            >
              📊 导出Excel
            </button>
          </div>

          {/* 筛选器 */}
          <div style={{
            ...subCard,
            padding: 15,
            marginBottom: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>单位筛选</label>
              <select
                value={unitFilter}
                onChange={e => setUnitFilter(e.target.value)}
                 style={{
                   width: '100%',
                   padding: 8,
                   borderRadius: 8,
                   border: '1px solid #e5e7eb',
                   background: '#fff',
                   color: '#111827',
                   fontSize: 14
                 }}
              >
                <option value="">全部单位</option>
                {units.map(unit => (
                  <option key={unit} value={unit} style={{ background: '#2c3e50', color: '#fff' }}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>部门筛选</label>
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                 style={{
                   width: '100%',
                   padding: 8,
                   borderRadius: 8,
                   border: '1px solid #e5e7eb',
                   background: '#fff',
                   color: '#111827',
                   fontSize: 14
                 }}
              >
                <option value="">全部部门</option>
                {departments.map(dept => (
                  <option key={dept} value={dept} style={{ background: '#2c3e50', color: '#fff' }}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>班组筛选</label>
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                 style={{
                   width: '100%',
                   padding: 8,
                   borderRadius: 8,
                   border: '1px solid #e5e7eb',
                   background: '#fff',
                   color: '#111827',
                   fontSize: 14
                 }}
              >
                <option value="">全部班组</option>
                {teams.map(team => (
                  <option key={team} value={team} style={{ background: '#2c3e50', color: '#fff' }}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>工种筛选</label>
              <select
                value={jobTypeFilter}
                onChange={e => setJobTypeFilter(e.target.value)}
                 style={{
                   width: '100%',
                   padding: 8,
                   borderRadius: 8,
                   border: '1px solid #e5e7eb',
                   background: '#fff',
                   color: '#111827',
                   fontSize: 14
                 }}
              >
                <option value="">全部工种</option>
                {jobTypes.map(jobType => (
                  <option key={jobType} value={jobType} style={{ background: '#2c3e50', color: '#fff' }}>{jobType}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                onClick={() => {
                  setUnitFilter('');
                  setDepartmentFilter('');
                  setTeamFilter('');
                  setJobTypeFilter('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🔄 重置筛选
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', border: '1px solid #eef0f4', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(17,24,39,0.06)' }}>
              <thead>
                 <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>工号</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>姓名</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>单位</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>部门</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>班组</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>工种</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>完成文章</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>学习时长</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>平均成绩</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>最后学习</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '14px' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredUsers = userRecords.filter(user => {
                    return (
                      (!unitFilter || user.unit.includes(unitFilter)) &&
                      (!departmentFilter || user.department.includes(departmentFilter)) &&
                      (!teamFilter || user.team.includes(teamFilter)) &&
                      (!jobTypeFilter || user.jobType.includes(jobTypeFilter))
                    );
                  });

                  return filteredUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                          {user.employeeId}
                        </code>
                      </td>
                       <td style={{ padding: '8px', fontSize: '14px', fontWeight: 600 }}>{user.name}</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                         <span style={{
                           background: '#fff7ed',
                           color: '#d97706',
                           padding: '2px 8px',
                           borderRadius: 12,
                           fontSize: 12,
                           border: '1px solid #fde68a'
                         }}>
                          {user.unit}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>{user.department}</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                         <span style={{
                           background: '#eff6ff',
                           color: '#2563eb',
                           padding: '2px 8px',
                           borderRadius: 12,
                           fontSize: 12,
                           border: '1px solid #bfdbfe'
                         }}>
                          {user.team}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                         <span style={{
                           background: '#ecfdf5',
                           color: '#059669',
                           padding: '2px 8px',
                           borderRadius: 12,
                           fontSize: 12,
                           border: '1px solid #a7f3d0'
                         }}>
                          {user.jobType}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>{user.completedArticles}</td>
                       <td style={{ padding: '8px', fontSize: '14px', color: '#334155' }}>{user.totalStudyTime}分钟</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                         <span style={{
                           background: user.averageScore >= 90 ? '#ecfdf5' : user.averageScore >= 80 ? '#fff7ed' : '#fee2e2',
                           color: user.averageScore >= 90 ? '#059669' : user.averageScore >= 80 ? '#d97706' : '#b91c1c',
                           border: `1px solid ${user.averageScore >= 90 ? '#a7f3d0' : user.averageScore >= 80 ? '#fde68a' : '#fecaca'}`,
                           padding: '2px 8px',
                           borderRadius: 12,
                           fontSize: 12
                         }}>
                          {user.averageScore}分
                        </span>
                      </td>
                       <td style={{ padding: '8px', fontSize: '14px', color: '#64748b' }}>{user.lastStudyTime}</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                         <span style={{
                           padding: '4px 8px',
                           background: user.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                           color: user.status === 'active' ? '#059669' : '#64748b',
                           borderRadius: 6,
                           border: `1px solid ${user.status === 'active' ? '#a7f3d0' : '#e2e8f0'}`,
                           fontSize: 12
                         }}>
                          {user.status === 'active' ? '活跃' : '非活跃'}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* 显示筛选结果统计 */}
          <div style={{ 
            marginTop: '15px', 
            textAlign: 'center', 
            fontSize: '14px', 
            color: '#6b7280'
          }}>
            {(() => {
              const filteredCount = userRecords.filter(user => {
                return (
                  (!unitFilter || user.unit.includes(unitFilter)) &&
                  (!departmentFilter || user.department.includes(departmentFilter)) &&
                  (!teamFilter || user.team.includes(teamFilter)) &&
                  (!jobTypeFilter || user.jobType.includes(jobTypeFilter))
                );
              }).length;
              return `显示 ${filteredCount} 条记录，共 ${userRecords.length} 条`;
            })()}
          </div>
        </div>
      )}

      {/* 用户管理页面 */}
      {activeTab === 'user-management' && (
        <div style={{ ...lightCard, padding: 20 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>🔑 用户账号管理</h3>
          <Suspense fallback={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              fontSize: '16px',
              color: '#6b7280'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#6366f1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 10px'
                }}></div>
                加载用户管理模块...
              </div>
            </div>
          }>
            <UserManagement currentUser={_user} />
          </Suspense>
        </div>
      )}

      {/* 文章学习记录查询页面 */}
      {activeTab === 'article-records' && (
        <ArticleLearningRecords currentUser={_user} />
      )}

      {/* 文章管理页面 */}
      {activeTab === 'articles' && (
        <div style={{ ...lightCard, padding: 20 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>文章内容管理</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleAdd}
              style={{
                padding: '8px 14px',
                background: '#111827',
                color: '#fff',
                border: '1px solid #111827',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              ➕ 添加文章
            </button>
            <button
              onClick={() => setShowFileUpload(true)}
              style={{
                padding: '8px 14px',
                background: '#fff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              📄 上传文件
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await syncFromCloud();
                  if (result.success) {
                    // 重新加载文章列表
                    await loadArticlesFromAPI();
                    alert(`✅ ${result.message}`);
                  } else {
                    alert(`❌ ${result.message}`);
                  }
                } catch (error) {
                  alert(`同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
                }
              }}
              style={{ padding: '8px 14px', background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              ⬇️ 从云端同步
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await syncToCloud();
                  // 重新加载文章列表以获取最新数据
                  await loadArticlesFromAPI();
                  if (result.success > 0) {
                    alert(`✅ 同步成功！\n成功: ${result.success} 篇\n失败: ${result.failed} 篇${result.errors.length > 0 ? '\n\n错误详情:\n' + result.errors.join('\n') : ''}`);
                  } else if (result.failed > 0) {
                    alert(`❌ 同步失败！\n错误详情:\n${result.errors.join('\n')}`);
                  } else {
                    alert('📝 没有文章需要同步');
                  }
                } catch (error) {
                  alert(`同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
                }
              }}
              style={{ padding: '8px 14px', background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              ⬆️ 同步到云端
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>标题</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>分类</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>发布日期</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>要求阅读时间</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {articlesLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      ⏳ 正在加载文章列表...
                    </td>
                  </tr>
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      📝 暂无文章，点击"添加文章"或"上传文件"开始创建
                    </td>
                  </tr>
                ) : articles.map(article => (
                  <tr key={article.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '12px' }}>{article.title}</td>
                    <td style={{ padding: '12px' }}>{article.category}</td>
                    <td style={{ padding: '12px' }}>{new Date().toISOString().split('T')[0]}</td>
                    <td style={{ padding: '12px' }}>{article.requiredReadingTime}分钟</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleEdit(article)}
                        style={{
                          marginRight: 8,
                          padding: '6px 12px',
                          background: '#fff',
                          color: '#111827',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#111827',
                          color: '#fff',
                          border: '1px solid #111827',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 文章编辑/添加表单弹窗 */}
          {showForm && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.4)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowForm(false);
                  setEditArticle(null);
                }
              }}
            >
              <div
                style={{
                  background: '#222',
                  borderRadius: '16px',
                  minWidth: 800,
                  maxWidth: 1200,
                  width: '95vw',
                  maxHeight: '90vh',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 固定标题栏 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '20px 20px 15px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  flexShrink: 0
                }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{formType === 'add' ? '添加文章' : '编辑文章'}</h3>
                  
                  {/* 操作按钮组 */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditArticle(null); }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'background 0.3s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      form="article-form"
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditArticle(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '4px',
                        opacity: 0.7,
                        transition: 'opacity 0.3s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
                      title="关闭"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <form
                  id="article-form"
                  onSubmit={handleFormSubmit}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  {/* 左右分栏内容区域 */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    gap: '20px',
                    overflow: 'hidden'
                  }}>
                    {/* 左侧：基本信息 */}
                    <div style={{
                      flex: '1',
                      overflowY: 'auto',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <label>
                        标题：
                        <input
                          type="text"
                          value={editArticle?.title || ''}
                          onChange={e => setEditArticle(editArticle ? { ...editArticle, title: e.target.value } : null)}
                          style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', marginTop: 4, boxSizing: 'border-box' }}
                          required
                        />
                      </label>
                      <label>
                        分类：
                        <select
                          value={editArticle?.category || categories[0]}
                          onChange={e => setEditArticle(editArticle ? { ...editArticle, category: e.target.value } : null)}
                          style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', marginTop: 4, boxSizing: 'border-box' }}
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        要求阅读时间（分钟）：
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={editArticle?.requiredReadingTime || 30}
                          onChange={e => setEditArticle(editArticle ? { ...editArticle, requiredReadingTime: parseInt(e.target.value) || 30 } : null)}
                          style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', marginTop: 4, boxSizing: 'border-box' }}
                          required
                        />
                      </label>

                      {/* 工种分配选择器 */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#374151' }}>
                          工种分配：
                        </label>
                        <div style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '12px'
                          }}>
                            <label style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              fontSize: '14px',
                              color: '#fff'
                            }}>
                              <input
                                type="checkbox"
                                checked={!editArticle?.allowedJobTypes || editArticle.allowedJobTypes.length === 0}
                                onChange={(e) => {
                                  if (editArticle) {
                                    setEditArticle({
                                      ...editArticle,
                                      allowedJobTypes: e.target.checked ? [] : [getAllJobTypes()[0]]
                                    });
                                  }
                                }}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              所有工种都可以访问
                            </label>
                          </div>

                          {editArticle?.allowedJobTypes && editArticle.allowedJobTypes.length > 0 && (
                            <div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: 'rgba(255,255,255,0.8)', 
                                marginBottom: '8px' 
                              }}>
                                选择可以访问该文章的工种：
                              </div>
                              
                              {/* 按分组显示工种 */}
                              {Object.entries(JOB_TYPE_GROUPS).map(([groupName, groupTypes]) => (
                                <div key={groupName} style={{
                                  marginBottom: '12px',
                                  padding: '8px',
                                  background: 'rgba(255,255,255,0.02)',
                                  borderRadius: '6px'
                                }}>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    fontWeight: 'bold', 
                                    color: '#fff',
                                    marginBottom: '6px' 
                                  }}>
                                    {groupName}
                                  </div>
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '6px'
                                  }}>
                                    {groupTypes.map(jobType => (
                                      <label key={jobType} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '12px',
                                        color: 'rgba(255,255,255,0.9)',
                                        cursor: 'pointer'
                                      }}>
                                        <input
                                          type="checkbox"
                                          checked={editArticle.allowedJobTypes?.includes(jobType as JobType) || false}
                                          onChange={(e) => {
                                            if (editArticle) {
                                              const currentTypes = editArticle.allowedJobTypes || [];
                                              let newTypes: JobType[];
                                              
                                              if (e.target.checked) {
                                                newTypes = [...currentTypes, jobType as JobType];
                                              } else {
                                                newTypes = currentTypes.filter(t => t !== jobType);
                                              }
                                              
                                              setEditArticle({
                                                ...editArticle,
                                                allowedJobTypes: newTypes
                                              });
                                            }
                                          }}
                                        />
                                        {jobType}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {/* 快速操作按钮 */}
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginTop: '10px' 
                              }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editArticle) {
                                      setEditArticle({
                                        ...editArticle,
                                        allowedJobTypes: getAllJobTypes()
                                      });
                                    }
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    background: 'rgba(103, 194, 58, 0.2)',
                                    color: '#67c23a',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                  }}
                                >
                                  全选
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editArticle) {
                                      setEditArticle({
                                        ...editArticle,
                                        allowedJobTypes: []
                                      });
                                    }
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    background: 'rgba(245, 108, 108, 0.2)',
                                    color: '#f56c6c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                  }}
                                >
                                  清空
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <label>
                        内容：
                        <textarea
                          value={editArticle?.content || ''}
                          onChange={e => setEditArticle(editArticle ? { ...editArticle, content: e.target.value } : null)}
                          style={{ 
                            width: '100%', 
                            minHeight: 200, 
                            maxHeight: 300,
                            borderRadius: 6, 
                            border: 'none', 
                            marginTop: 4, 
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                      </label>
                    </div>

                    {/* 右侧：题目编辑 */}
                    <div style={{
                      flex: '1',
                      borderLeft: '1px solid rgba(255,255,255,0.1)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>📝 考试题目 ({editArticle?.questions?.length || 0}题)</h4>
                        <button
                          type="button"
                          onClick={() => {
                            if (editArticle) {
                              const newQuestion = {
                                id: Date.now(),
                                question: '',
                                options: ['', '', '', ''],
                                correctAnswer: 0
                              };
                              setEditArticle({
                                ...editArticle,
                                questions: [...(editArticle.questions || []), newQuestion]
                              });
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ➕ 添加题目
                        </button>
                      </div>

                      {/* 题目列表 */}
                      <div style={{ 
                        flex: 1,
                        overflowY: 'auto',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.02)'
                      }}>
                        {editArticle?.questions?.map((question, qIndex) => (
                          <div key={question.id} style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '12px',
                            borderRadius: '6px',
                            marginBottom: '10px',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>题目 {qIndex + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editArticle) {
                                    const updatedQuestions = editArticle.questions.filter((_, index) => index !== qIndex);
                                    setEditArticle({ ...editArticle, questions: updatedQuestions });
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(245, 108, 108, 0.2)',
                                  color: '#f56c6c',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                删除
                              </button>
                            </div>
                            
                            <textarea
                              placeholder="请输入题目内容..."
                              value={question.question}
                              onChange={(e) => {
                                if (editArticle) {
                                  const updatedQuestions = [...editArticle.questions];
                                  updatedQuestions[qIndex] = { ...question, question: e.target.value };
                                  setEditArticle({ ...editArticle, questions: updatedQuestions });
                                }
                              }}
                              style={{
                                width: '100%',
                                minHeight: '50px',
                                maxHeight: '80px',
                                padding: '6px',
                                borderRadius: '4px',
                                border: 'none',
                                marginBottom: '8px',
                                resize: 'vertical',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                              }}
                            />
                            
                            {/* 选项输入 */}
                            <div style={{ display: 'grid', gap: '6px' }}>
                              {question.options.map((option, oIndex) => {
                                const optionLabels = ['A', 'B', 'C', 'D'];
                                const isCorrect = question.correctAnswer === oIndex;
                                return (
                                  <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editArticle) {
                                          const updatedQuestions = [...editArticle.questions];
                                          updatedQuestions[qIndex] = { ...question, correctAnswer: oIndex };
                                          setEditArticle({ ...editArticle, questions: updatedQuestions });
                                        }
                                      }}
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: `2px solid ${isCorrect ? '#67c23a' : 'rgba(255,255,255,0.3)'}`,
                                        background: isCorrect ? '#67c23a' : 'transparent',
                                        color: isCorrect ? '#fff' : 'rgba(255,255,255,0.6)',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      title={`点击设为正确答案`}
                                    >
                                      {isCorrect ? '✓' : optionLabels[oIndex]}
                                    </button>
                                    <input
                                      type="text"
                                      placeholder={`选项${optionLabels[oIndex]}`}
                                      value={option}
                                      onChange={(e) => {
                                        if (editArticle) {
                                          const updatedQuestions = [...editArticle.questions];
                                          const updatedOptions = [...question.options];
                                          updatedOptions[oIndex] = e.target.value;
                                          updatedQuestions[qIndex] = { ...question, options: updatedOptions };
                                          setEditArticle({ ...editArticle, questions: updatedQuestions });
                                        }
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        border: `1px solid ${isCorrect ? '#67c23a' : 'rgba(255,255,255,0.2)'}`,
                                        background: isCorrect ? 'rgba(103, 194, 58, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: '#fff',
                                        fontSize: '11px',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {(!editArticle?.questions || editArticle?.questions?.length === 0) && (
                          <div style={{
                            textAlign: 'center',
                            padding: '30px 20px',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px'
                          }}>
                            还没有添加题目<br/>点击"➕ 添加题目"开始录入
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 统计分析页面 */}
      {activeTab === 'statistics' && (
        <div>
          {/* KPI 概览 */}
          <div style={{ ...lightCard, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>学习统计</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              {[{label:'平均完成率', value:`${statsKpi.averageCompletionRate}%`, color:'#4f46e5'}, {label:'平均成绩', value:`${statsKpi.averageScore}分`, color:'#059669'}, {label:'平均学习时长', value:`${statsKpi.averageStudyMinutes}分钟`, color:'#d97706'}, {label:'活跃用户比例', value:`${statsKpi.activeRatio}%`, color:'#b91c1c'}].map((kpi) => (
                <div key={kpi.label} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{kpi.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 分类学习情况 */}
          <div style={{ ...lightCard, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>分类学习情况</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {categoryStats.length > 0 ? categoryStats.map((item) => (
                <div key={item.category} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: 700 }}>{item.category}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{item.learners} 人学习</div>
                </div>
              )) : (
                <div style={{ color: '#9ca3af' }}>暂无数据</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 照片管理页面 */}
      {activeTab === 'photos' && (
        <div style={{ ...lightCard, padding: 20 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>📷 学习监控照片管理</h3>
          
          {/* 照片统计（云端） */}
          <div style={{ ...subCard, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>照片统计</h4>
            <PhotoStatsPanel />
          </div>

          {/* 照片列表 */}
          <div style={{ ...subCard, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, fontSize: '16px' }}>最近照片</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={async () => {
                    if (!window.confirm('确定要清空所有照片吗？此操作不可恢复！')) return;
                    try {
                      const res = await photoAPI.list();
                      if (res && res.success) {
                        const items = res.data || [];
                        for (const item of items) {
                          try { await photoAPI.delete(item.id); } catch {}
                        }
                        alert('云端照片已清空');
                      } else {
                        alert('清空失败：无法获取列表');
                      }
                    } catch (e) {
                      alert('清空失败');
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(90deg,#f56c6c 60%,#fab6b6 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  清空所有照片
                </button>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <PhotoListPanel />
                    </div>
          </div>
        </div>
      )}

      {/* 系统设置页面 */}
      {activeTab === 'settings' && (
        <div style={{ ...lightCard, padding: 20 }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>系统设置</h3>
          
          {/* 摄像头设置 */}
          <div style={{ ...subCard, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📷 摄像头监控设置</h4>
            
            {/* 基础拍照间隔设置 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
              <label style={{ fontSize: '14px' }}>
                拍照间隔：
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={cameraInterval}
                  onChange={(e) => setCameraInterval(parseInt(e.target.value) || 30)}
                  style={{
                    marginLeft: 10,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    width: 90
                  }}
                />
                秒
              </label>
            </div>

            {/* 随机拍摄设置 */}
            <div style={{ ...subCard, padding: 15, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={enableRandomCapture}
                    onChange={(e) => setEnableRandomCapture(e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  🎲 启用随机拍摄N张
                </label>
                {enableRandomCapture && (
                  <label style={{ fontSize: '14px' }}>
                    拍摄数量：
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={randomCaptureCount}
                      onChange={(e) => setRandomCaptureCount(parseInt(e.target.value) || 3)}
                      style={{
                        marginLeft: 10,
                        padding: 6,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        width: 70
                      }}
                    />
                    张
                  </label>
                )}
              </div>
              <p style={{ 
                margin: '0', 
                fontSize: '12px', 
                opacity: 0.7,
                lineHeight: '1.3'
              }}>
                说明：启用后，系统会在学习过程中随机时间点连续拍摄N张照片，增强监控效果。
              </p>
            </div>

            {/* 防代学功能设置 */}
            <div style={{ ...subCard, padding: 15, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={enableAntiCheating}
                    onChange={(e) => setEnableAntiCheating(e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  🔒 启用防代学功能
                </label>
              </div>
              <p style={{ 
                margin: '0', 
                fontSize: '12px', 
                opacity: 0.7,
                lineHeight: '1.3'
              }}>
                说明：启用后，系统会进行人脸识别，当检测到不是本人时，学习进度将暂停，需要本人重新验证身份。
              </p>
            </div>

            {/* 保存按钮 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  updateSettings({ 
                    cameraInterval,
                    enableRandomCapture,
                    randomCaptureCount,
                    enableAntiCheating 
                  });
                  alert(`摄像头设置已保存！\n拍照间隔: ${cameraInterval}秒\n随机拍摄: ${enableRandomCapture ? '启用' : '关闭'}${enableRandomCapture ? `(${randomCaptureCount}张)` : ''}\n防代学功能: ${enableAntiCheating ? '启用' : '关闭'}`);
                }}
                style={{
                  padding: '8px 14px',
                  background: '#111827',
                  color: '#fff',
                  border: '1px solid #111827',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                保存设置
              </button>
            </div>

            <p style={{ 
              margin: '15px 0 0 0', 
              fontSize: '12px', 
              opacity: 0.8,
              lineHeight: '1.4'
            }}>
              说明：在学习过程中，系统会按照设定的间隔时间自动拍摄照片进行学习监控。
              建议间隔时间设置在10-300秒之间，以确保既能有效监控又不会过于频繁。
            </p>
          </div>

          {/* 阅读时间设置 */}
          <div style={{ ...subCard, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>⏱️ 阅读时间设置</h4>
            <p style={{ 
              margin: '0 0 15px 0', 
              fontSize: '14px', 
              opacity: 0.8,
              lineHeight: '1.4'
            }}>
              每篇文章的阅读时间可以在"文章管理"页面中单独设置。
              管理员可以为不同难度的文章设置不同的阅读时间要求。
            </p>
            <button
              onClick={() => setActiveTab('articles')}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              前往文章管理
            </button>
          </div>

          {/* 数据管理 */}
          <div style={{ ...subCard, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>💾 数据管理</h4>
            {(() => {
              const systemData = getAllSystemData();
              const storageUsage = getStorageUsage();
              return (
                <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
                  <p><strong>文章数量：</strong>{systemData.stats.totalArticles}</p>
                  <p><strong>照片数量：</strong>{systemData.stats.totalPhotos}</p>
                  <p><strong>今日照片：</strong>{systemData.stats.todayPhotos}</p>
                  <p><strong>存储使用：</strong>{storageUsage.used} / {storageUsage.max} ({storageUsage.percent}%)</p>
                  <p><strong>剩余空间：</strong>{storageUsage.remaining}</p>
                </div>
              );
            })()}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={backupData}
                style={{ padding: '8px 14px', background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                备份所有数据
              </button>

              <button
                onClick={() => {
                  if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
                    clearAllData();
                  }
                }}
                style={{ padding: '8px 14px', background: '#111827', color: '#fff', border: '1px solid #111827', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                清空所有数据
              </button>
            </div>
          </div>

          {/* 存储详情 */}
          <div style={{ ...subCard, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📊 存储详情</h4>
            {(() => {
              const storageData = getLearningStorageData();
              return (
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {storageData.map(item => (
                    <div key={item.key} style={{ 
                      marginBottom: '10px', 
                      padding: '10px', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '6px' 
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {item.key === 'learning_articles' ? '📄 文章数据' :
                         item.key === 'learning_photos' ? '📷 照片数据' :
                         item.key === 'learning_settings' ? '⚙️ 系统设置' : item.key}
                      </div>
                      <div>大小: {item.size}</div>
                      {item.itemCount !== undefined && (
                        <div>项目数量: {item.itemCount}</div>
                      )}
                      <div>数据类型: {Array.isArray(item.data) ? '数组' : typeof item.data}</div>
                    </div>
                  ))}
                  {storageData.length === 0 && (
                    <div style={{ opacity: 0.6, textAlign: 'center' }}>
                      暂无存储数据
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 云服务器存储 */}
          <div style={{ ...subCard, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>🗄️ 云服务器存储</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
              <p><strong>存储状态：</strong>
                    <span style={{ 
                  color: '#10b981',
                      fontWeight: 'bold'
                    }}>
                  ✅ 已启用
                    </span>
                  </p>
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <p><strong>服务器地址：</strong>{STORAGE_CONFIG.serverConfig.baseUrl}</p>
                <p><strong>API端点：</strong>{STORAGE_CONFIG.serverConfig.apiPath}</p>
                <p><strong>文件大小限制：</strong>{Math.round(STORAGE_CONFIG.serverConfig.maxFileSize / 1024 / 1024)}MB</p>
                <p><strong>存储类型：</strong>云服务器统一存储</p>
                    </div>
                </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowServerConfig(true)}
                style={{ padding: '8px 14px', background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                🔍 服务器配置
              </button>
              <button
                onClick={() => setShowStoragePanel(true)}
                style={{ padding: '8px 14px', background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                📁 存储管理
              </button>
              <button
                onClick={async () => {
                  try {
                    const { FILE_API_BASE } = await import('./fileUploadService');
                    const response = await fetch(`${FILE_API_BASE}/health`);
                    const result = await response.json();
                    if (result.success) {
                      alert('✅ 云服务器存储服务正常运行！');
                    } else {
                      alert('❌ 云服务器存储服务异常');
                    }
                  } catch (error) {
                    alert(`❌ 连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
                  }
                }}
                style={{ padding: '8px 14px', background: '#111827', color: '#fff', border: '1px solid #111827', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                🔍 状态检查
              </button>
            </div>
          </div>

          {/* 系统信息 */}
          <div style={{ ...subCard, padding: 20 }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>ℹ️ 系统信息</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>系统名称：</strong>班前学习监督系统</p>
              <p><strong>当前版本：</strong>v1.0.0</p>
              <p><strong>数据存储：</strong>云服务器统一存储</p>
              <p><strong>功能特性：</strong></p>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>文章阅读时间监控</li>
                <li>摄像头学习监控</li>
                <li>答题测试功能</li>
                <li>学习数据统计</li>
                <li>Excel数据导出</li>
                <li>数据持久化存储</li>
                <li>云服务器文件存储</li>
                <li>文件预览与下载</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 云服务器配置面板 */}
      {showServerConfig && (
        <ServerConfigPanel onClose={() => setShowServerConfig(false)} />
      )}

      {/* 云服务器存储管理面板 */}
      {showStoragePanel && (
        <ServerStoragePanel onClose={() => setShowStoragePanel(false)} />
      )}

      {/* 文件上传模态框 */}
      {showFileUpload && (
        <FileUploadModal 
          show={showFileUpload}
          onClose={() => setShowFileUpload(false)}
          onFileUploaded={handleFileUpload}
        />
      )}

      {/* 添加旋转动画 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );
};

export default AdminPanel; 