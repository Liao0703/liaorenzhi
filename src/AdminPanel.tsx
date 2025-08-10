import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

import { getAllArticles, updateArticle, addArticle, deleteArticle, syncFromCloud, syncToCloud } from './articleData';
import type { ArticleData } from './articleData';
import { getAllPhotos, getPhotoStats, clearAllPhotos } from './photoStorage';
import { getSettings, updateSettings } from './settingsStorage';
import { getAllSystemData, backupData, clearAllData } from './dataManager';
import { getLearningStorageData, getStorageUsage } from './storageViewer';
import { STORAGE_CONFIG } from './fileUploadService';
import ServerConfigPanel from './OSSConfigPanel';
import ServerStoragePanel from './HybridStoragePanel';
import FileUploadModal from './FileUploadModal';
import type { FileInfo } from './FileUploadModal';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'articles' | 'statistics' | 'photos' | 'settings'>('overview');
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
  const departments = ['白市驿车站'];
  
  // 班组选项
  const teams = ['运转一班', '运转二班', '运转三班', '运转四班'];
  
  // 工种选项
  const jobTypes = ['车站值班员', '助理值班员（内勤）', '助理值班员（外勤）', '连结员', '调车长', '列尾作业员', '站调', '车号员'];

  // 模拟用户学习记录
  const userRecords: UserRecord[] = [
    {
      id: 1,
      name: '张三',
      username: 'user001',
      employeeId: '10001',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转一班',
      jobType: '车站值班员',
      completedArticles: 8,
      totalStudyTime: 240,
      averageScore: 85,
      lastStudyTime: '2024-01-15 14:30',
      status: 'active'
    },
    {
      id: 2,
      name: '李四',
      username: 'user002',
      employeeId: '10002',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转二班',
      jobType: '助理值班员（内勤）',
      completedArticles: 6,
      totalStudyTime: 180,
      averageScore: 78,
      lastStudyTime: '2024-01-14 09:15',
      status: 'active'
    },
    {
      id: 3,
      name: '王五',
      username: 'user003',
      employeeId: '10003',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转一班',
      jobType: '助理值班员（外勤）',
      completedArticles: 4,
      totalStudyTime: 120,
      averageScore: 92,
      lastStudyTime: '2024-01-13 16:45',
      status: 'inactive'
    },
    {
      id: 4,
      name: '赵六',
      username: 'user004',
      employeeId: '10004',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转三班',
      jobType: '连结员',
      completedArticles: 5,
      totalStudyTime: 150,
      averageScore: 88,
      lastStudyTime: '2024-01-12 16:20',
      status: 'active'
    },
    {
      id: 5,
      name: '孙七',
      username: 'user005',
      employeeId: '10005',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转四班',
      jobType: '调车长',
      completedArticles: 7,
      totalStudyTime: 210,
      averageScore: 90,
      lastStudyTime: '2024-01-16 10:15',
      status: 'active'
    },
    {
      id: 6,
      name: '周八',
      username: 'user006',
      employeeId: '10006',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转二班',
      jobType: '列尾作业员',
      completedArticles: 3,
      totalStudyTime: 90,
      averageScore: 82,
      lastStudyTime: '2024-01-11 14:45',
      status: 'active'
    },
    {
      id: 7,
      name: '吴九',
      username: 'user007',
      employeeId: '10007',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转三班',
      jobType: '站调',
      completedArticles: 6,
      totalStudyTime: 180,
      averageScore: 86,
      lastStudyTime: '2024-01-15 09:30',
      status: 'active'
    },
    {
      id: 8,
      name: '郑十',
      username: 'user008',
      employeeId: '10008',
      unit: '兴隆场车站',
      department: '白市驿车站',
      team: '运转四班',
      jobType: '车号员',
      completedArticles: 4,
      totalStudyTime: 120,
      averageScore: 79,
      lastStudyTime: '2024-01-10 11:20',
      status: 'inactive'
    }
  ];



  // 文章内容管理 - 使用新的数据存储系统
  const [articles, setArticles] = useState<ArticleData[]>(getAllArticles());
  const [editArticle, setEditArticle] = useState<ArticleData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');
  const [cameraInterval, setCameraInterval] = useState(getSettings().cameraInterval); // 摄像头拍照间隔（秒）
  const [enableRandomCapture, setEnableRandomCapture] = useState(getSettings().enableRandomCapture); // 启用随机拍摄
  const [randomCaptureCount, setRandomCaptureCount] = useState(getSettings().randomCaptureCount); // 随机拍摄数量
  const [enableAntiCheating, setEnableAntiCheating] = useState(getSettings().enableAntiCheating); // 启用防代学功能

  // 文章分类
  const categories = ['安全规程', '设备维护', '应急处理', '信号系统', '调度规范', '作业标准'];

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
    // 使用文件信息创建新文章
    const newArticle = {
      ...emptyArticle,
      title: fileInfo.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
      content: `这是一个文件型文章，点击阅读时将打开: ${fileInfo.name}\n\n文件类型: ${fileInfo.fileType}\n文件大小: ${fileInfo.size ? Math.round(fileInfo.size / 1024) + 'KB' : '未知'}`,
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
    alert('📄 文件上传成功！\n\n请在接下来的表单中：\n1. 修改文章标题和分类\n2. 设置要求阅读时间\n3. 添加考试题目（推荐）\n4. 点击保存完成创建');
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
      setArticles(getAllArticles());
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
      setArticles(getAllArticles());
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

  // 统计数据
  const stats = {
    totalUsers: userRecords.length,
    activeUsers: userRecords.filter(user => user.status === 'active').length,
    totalArticles: 15,
    totalStudyTime: Math.round(userRecords.reduce((total, user) => total + user.totalStudyTime, 0) / 60), // 转换为小时
    averageCompletionRate: Math.round(userRecords.reduce((total, user) => total + user.completedArticles, 0) / userRecords.length),
    averageScore: Math.round(userRecords.reduce((total, user) => total + user.averageScore, 0) / userRecords.length)
  };



  return (
    <div style={{ 
      position: 'relative', 
      zIndex: 10, 
      padding: '20px',
      color: '#fff',
      minHeight: '100vh'
    }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>管理后台</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            返回首页
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div style={{
        display: 'flex',
        gap: '5px',
        marginBottom: '20px',
        background: 'rgba(0,0,0,0.3)',
        padding: '5px',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)'
      }}>
        {[
          { key: 'overview', label: '总览' },
          { key: 'users', label: '学习记录' },
          { key: 'articles', label: '文章管理' },
          { key: 'statistics', label: '统计分析' },
          { key: 'photos', label: '照片管理' },
          { key: 'settings', label: '系统设置' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.key 
                ? 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)' 
                : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 总览页面 */}
      {activeTab === 'overview' && (
        <div>
          {/* 统计卡片 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'rgba(64, 158, 255, 0.2)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(64, 158, 255, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>总用户数</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalUsers}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                活跃用户：{stats.activeUsers}
              </div>
            </div>

            <div style={{
              background: 'rgba(103, 194, 58, 0.2)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(103, 194, 58, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>文章总数</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalArticles}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                平均完成率：{stats.averageCompletionRate}%
              </div>
            </div>

            <div style={{
              background: 'rgba(230, 162, 60, 0.2)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(230, 162, 60, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>总学习时长</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalStudyTime}h</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                平均成绩：{stats.averageScore}分
              </div>
            </div>
          </div>

          {/* 最近活动 */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>最近活动</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                <span>张三 完成了《铁路安全操作规程》学习</span>
                <span style={{ opacity: 0.8 }}>2024-01-15 14:30</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                <span>李四 开始学习《设备维护保养指南》</span>
                <span style={{ opacity: 0.8 }}>2024-01-15 13:45</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                <span>王五 完成了《应急处理流程》测试</span>
                <span style={{ opacity: 0.8 }}>2024-01-15 12:20</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学习记录管理页面 */}
      {activeTab === 'users' && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '20px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>学习记录管理</h3>
            <button
              onClick={exportLearningRecordsToExcel}
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(103, 194, 58, 0.3)'
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
            background: 'rgba(255,255,255,0.1)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>单位筛选</label>
              <select
                value={unitFilter}
                onChange={e => setUnitFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="">全部单位</option>
                {units.map(unit => (
                  <option key={unit} value={unit} style={{ background: '#2c3e50', color: '#fff' }}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>部门筛选</label>
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="">全部部门</option>
                {departments.map(dept => (
                  <option key={dept} value={dept} style={{ background: '#2c3e50', color: '#fff' }}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>班组筛选</label>
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="">全部班组</option>
                {teams.map(team => (
                  <option key={team} value={team} style={{ background: '#2c3e50', color: '#fff' }}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#fff' }}>工种筛选</label>
              <select
                value={jobTypeFilter}
                onChange={e => setJobTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '14px'
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
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 重置筛选
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
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
                    return (!unitFilter || user.unit === unitFilter) &&
                           (!departmentFilter || user.department === departmentFilter) &&
                           (!teamFilter || user.team === teamFilter) &&
                           (!jobTypeFilter || user.jobType === jobTypeFilter);
                  });

                  return filteredUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                          {user.employeeId}
                        </code>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px', fontWeight: '500' }}>{user.name}</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <span style={{
                          background: 'rgba(230, 162, 60, 0.2)',
                          color: '#e6a23c',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {user.unit}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>{user.department}</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <span style={{
                          background: 'rgba(64, 158, 255, 0.2)',
                          color: '#409eff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {user.team}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <span style={{
                          background: 'rgba(103, 194, 58, 0.2)',
                          color: '#67c23a',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {user.jobType}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>{user.completedArticles}</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>{user.totalStudyTime}分钟</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <span style={{
                          background: user.averageScore >= 90 ? '#67c23a' : user.averageScore >= 80 ? '#e6a23c' : '#f56c6c',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {user.averageScore}分
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>{user.lastStudyTime}</td>
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: user.status === 'active' ? '#67c23a' : '#909399',
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '12px'
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
            opacity: 0.8,
            color: '#fff'
          }}>
            {(() => {
              const filteredCount = userRecords.filter(user => {
                return (!unitFilter || user.unit === unitFilter) &&
                       (!departmentFilter || user.department === departmentFilter) &&
                       (!teamFilter || user.team === teamFilter) &&
                       (!jobTypeFilter || user.jobType === jobTypeFilter);
              }).length;
              return `显示 ${filteredCount} 条记录，共 ${userRecords.length} 条`;
            })()}
          </div>
        </div>
      )}

      {/* 文章管理页面 */}
      {activeTab === 'articles' && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '20px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>文章内容管理</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={handleAdd}
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              ➕ 添加文章
            </button>
            <button
              onClick={() => setShowFileUpload(true)}
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              📄 上传文件
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await syncFromCloud();
                  if (result.success) {
                    setArticles(getAllArticles());
                    alert(`✅ ${result.message}`);
                  } else {
                    alert(`❌ ${result.message}`);
                  }
                } catch (error) {
                  alert(`同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
                }
              }}
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(90deg,#e6a23c 60%,#f3d19e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              ⬇️ 从云端同步
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await syncToCloud();
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
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(90deg,#f56c6c 60%,#fab6b6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
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
                {articles.map(article => (
                  <tr key={article.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '12px' }}>{article.title}</td>
                    <td style={{ padding: '12px' }}>{article.category}</td>
                    <td style={{ padding: '12px' }}>{new Date().toISOString().split('T')[0]}</td>
                    <td style={{ padding: '12px' }}>{article.requiredReadingTime}分钟</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleEdit(article)}
                        style={{
                          marginRight: '10px',
                          padding: '4px 12px',
                          background: 'linear-gradient(90deg,#e6a23c 60%,#f3d19e 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        style={{
                          padding: '4px 12px',
                          background: 'linear-gradient(90deg,#f56c6c 60%,#fab6b6 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
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
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>学习趋势分析</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#409eff' }}>87%</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>平均完成率</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#67c23a' }}>84分</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>平均成绩</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e6a23c' }}>32分钟</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>平均学习时长</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f56c6c' }}>72%</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>活跃用户比例</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>分类学习情况</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              {['安全规程', '设备维护', '应急处理', '信号系统', '调度规范', '作业标准'].map(category => (
                <div key={category} style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{category}</div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {Math.floor(Math.random() * 20) + 10} 人学习
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 照片管理页面 */}
      {activeTab === 'photos' && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '20px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>📷 学习监控照片管理</h3>
          
          {/* 照片统计 */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>照片统计</h4>
            {(() => {
              const stats = getPhotoStats();
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#409eff' }}>{stats.totalPhotos}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>总照片数</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#67c23a' }}>{stats.todayPhotos}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>今日照片数</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 照片列表 */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, fontSize: '16px' }}>最近照片</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    if (window.confirm('确定要清空所有照片吗？此操作不可恢复！')) {
                      clearAllPhotos();
                      alert('所有照片已清空');
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
              {(() => {
                const photos = getAllPhotos();
                if (photos.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                      暂无照片数据
                    </div>
                  );
                }
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {photos.slice(-10).reverse().map(photo => (
                      <div key={photo.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        gap: '15px'
                      }}>
                        <img
                          src={photo.photoData}
                          alt="学习监控照片"
                          style={{
                            width: '60px',
                            height: '45px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            {photo.articleTitle}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            {new Date(photo.timestamp).toLocaleString('zh-CN')}
                          </div>
                          {photo.userName && (
                            <div style={{ fontSize: '12px', opacity: 0.6 }}>
                              用户：{photo.userName}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 系统设置页面 */}
      {activeTab === 'settings' && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '20px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>系统设置</h3>
          
          {/* 摄像头设置 */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📷 摄像头监控设置</h4>
            
            {/* 基础拍照间隔设置 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <label style={{ fontSize: '14px' }}>
                拍照间隔：
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={cameraInterval}
                  onChange={(e) => setCameraInterval(parseInt(e.target.value) || 30)}
                  style={{
                    marginLeft: '10px',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    width: '80px'
                  }}
                />
                秒
              </label>
            </div>

            {/* 随机拍摄设置 */}
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
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
                        marginLeft: '10px',
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        width: '60px'
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
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
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
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
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
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
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
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
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
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={backupData}
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
                备份所有数据
              </button>

              <button
                onClick={() => {
                  if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
                    clearAllData();
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg,#f56c6c 60%,#fab6b6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                清空所有数据
              </button>
            </div>
          </div>

          {/* 存储详情 */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
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
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
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
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowServerConfig(true)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg,#3b82f6 60%,#2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔍 服务器配置
              </button>
              <button
                onClick={() => setShowStoragePanel(true)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg,#10b981 60%,#059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📁 存储管理
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/files/health');
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
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg,#f59e0b 60%,#d97706 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔍 状态检查
              </button>
            </div>
          </div>

          {/* 系统信息 */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '8px'
          }}>
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
    </div>
  );
};

export default AdminPanel; 