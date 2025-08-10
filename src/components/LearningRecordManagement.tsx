import React, { useState, useEffect } from 'react';
import { learningRecordAPI } from '../config/api';
import * as XLSX from 'xlsx';

interface LearningRecord {
  id: number;
  userId: number;
  username: string;
  name: string;
  employee_id?: string; // 工号
  articleId: string;
  articleTitle: string;
  score?: number;
  completionTime: string;
  studyDuration: number; // 学习时长（分钟）
  quizCompleted: boolean;
  createdAt: string;
  department?: string;
  team?: string;
  job_type?: string; // 工种
}

interface LearningRecordManagementProps {
  currentUser: any;
}

const LearningRecordManagement: React.FC<LearningRecordManagementProps> = ({ currentUser: _currentUser }) => {
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // 模拟学习记录数据
  const mockRecords: LearningRecord[] = [
    {
      id: 1,
      userId: 1,
      username: 'user001',
      name: '张三',
      employee_id: '10001',
      articleId: 'art001',
      articleTitle: '安全操作规程学习',
      score: 85,
      completionTime: '2024-01-15 14:30:00',
      studyDuration: 45,
      quizCompleted: true,
      createdAt: '2024-01-15 14:30:00',
      department: '机务段',
      team: 'A班组',
      job_type: '司机'
    },
    {
      id: 2,
      userId: 2,
      username: 'user002',
      name: '李四',
      employee_id: '10002',
      articleId: 'art002',
      articleTitle: '应急处理流程',
      score: 92,
      completionTime: '2024-01-15 10:15:00',
      studyDuration: 38,
      quizCompleted: true,
      createdAt: '2024-01-15 10:15:00',
      department: '车务段',
      team: 'B班组',
      job_type: '调度员'
    },
    {
      id: 3,
      userId: 3,
      username: 'user003',
      name: '王五',
      employee_id: '10003',
      articleId: 'art001',
      articleTitle: '安全操作规程学习',
      completionTime: '2024-01-14 16:45:00',
      studyDuration: 25,
      quizCompleted: false,
      createdAt: '2024-01-14 16:45:00',
      department: '工务段',
      team: 'C班组',
      job_type: '线路工'
    },
    {
      id: 4,
      userId: 1,
      username: 'user001',
      name: '张三',
      employee_id: '10001',
      articleId: 'art003',
      articleTitle: '设备维护手册',
      score: 78,
      completionTime: '2024-01-14 09:20:00',
      studyDuration: 52,
      quizCompleted: true,
      createdAt: '2024-01-14 09:20:00',
      department: '机务段',
      team: 'A班组',
      job_type: '司机'
    },
    {
      id: 5,
      userId: 4,
      username: 'user004',
      name: '赵六',
      employee_id: '10004',
      articleId: 'art002',
      articleTitle: '应急处理流程',
      score: 88,
      completionTime: '2024-01-13 15:30:00',
      studyDuration: 42,
      quizCompleted: true,
      createdAt: '2024-01-13 15:30:00',
      department: '电务段',
      team: 'D班组',
      job_type: '信号工'
    }
  ];

  // 加载学习记录
  const loadRecords = async () => {
    setLoading(true);
    try {
      // 尝试从API加载数据
      const response = await learningRecordAPI.getAll();
      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        // 如果API调用失败，使用模拟数据
        console.warn('API调用失败，使用模拟数据');
        setRecords(mockRecords);
      }
    } catch (error) {
      console.error('加载学习记录失败:', error);
      // 出错时使用模拟数据
      setRecords(mockRecords);
      
      // 显示错误提示
      alert('无法连接到学习记录服务，已切换到本地模拟数据。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // 过滤记录
  const filteredRecords = records.filter(record => {
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'completed' && record.quizCompleted) ||
      (selectedFilter === 'incomplete' && !record.quizCompleted);
    
    const matchesSearch = !searchTerm || 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.articleTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = !selectedUser || record.username === selectedUser;
    
    const matchesDate = !dateFilter || 
      record.createdAt.startsWith(dateFilter);
    
    return matchesFilter && matchesSearch && matchesUser && matchesDate;
  });

  // 获取唯一用户列表
  const uniqueUsers = Array.from(new Set(records.map(r => r.username)))
    .map(username => {
      const record = records.find(r => r.username === username);
      return { username, name: record?.name || username };
    });



  // 获取统计信息
  const getStats = () => {
    const total = records.length;
    const completed = records.filter(r => r.quizCompleted).length;
    const avgScore = records.filter(r => r.score).reduce((sum, r) => sum + (r.score || 0), 0) / 
                    records.filter(r => r.score).length || 0;
    const totalStudyTime = records.reduce((sum, r) => sum + r.studyDuration, 0);

    return { total, completed, avgScore: Math.round(avgScore), totalStudyTime };
  };

  const stats = getStats();

  // 导出Excel功能
  const exportToExcel = () => {
    try {
      // 准备导出的数据
      const exportData = filteredRecords.map((record, index) => ({
        '序号': index + 1,
        '工号': record.employee_id || '-',
        '姓名': record.name,
        '用户名': record.username,
        '单位': record.department === '机务段' ? '兴隆场车站' : (record.department || '-'),
        '部门': record.department || '-',
        '班组': record.team || '-',
        '工种': record.job_type || '-',
        '学习文章': record.articleTitle,
        '学习时长(分钟)': record.studyDuration,
        '测验分数': record.score || '未完成',
        '完成状态': record.quizCompleted ? '已完成' : '未完成',
        '完成时间': new Date(record.completionTime).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
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
        { wch: 12 },  // 工种
        { wch: 20 },  // 学习文章
        { wch: 12 },  // 学习时长
        { wch: 10 },  // 测验分数
        { wch: 10 },  // 完成状态
        { wch: 16 }   // 完成时间
      ];
      ws['!cols'] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '学习记录');

      // 生成文件名（包含当前时间）
      const now = new Date();
      const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
      const filename = `学习记录-${dateStr}-${timeStr}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, filename);

      alert(`已成功导出 ${filteredRecords.length} 条学习记录到 ${filename}`);
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出Excel失败，请重试');
    }
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      padding: '20px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      color: '#fff'
    }}>
      {/* 标题和统计 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>📊 学习记录管理</h3>
          <button
            onClick={exportToExcel}
            disabled={loading || filteredRecords.length === 0}
            style={{
              padding: '8px 18px',
              background: loading || filteredRecords.length === 0 
                ? 'rgba(255,255,255,0.3)' 
                : 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || filteredRecords.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: loading || filteredRecords.length === 0 ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              boxShadow: loading || filteredRecords.length === 0 
                ? 'none' 
                : '0 2px 8px rgba(103, 194, 58, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!loading && filteredRecords.length > 0) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(103, 194, 58, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading && filteredRecords.length > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(103, 194, 58, 0.3)';
              }
            }}
          >
            📊 导出Excel
          </button>
        </div>

        {/* 统计卡片 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'rgba(64, 158, 255, 0.2)',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>总学习记录</div>
          </div>
          <div style={{
            background: 'rgba(103, 194, 58, 0.2)',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.completed}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>已完成测验</div>
          </div>
          <div style={{
            background: 'rgba(230, 162, 60, 0.2)',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.avgScore}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>平均分数</div>
          </div>
          <div style={{
            background: 'rgba(245, 108, 108, 0.2)',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.round(stats.totalStudyTime / 60)}h</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>总学习时长</div>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>完成状态</label>
          <select
            value={selectedFilter}
            onChange={e => setSelectedFilter(e.target.value as any)}
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
            <option value="all">全部记录</option>
            <option value="completed">已完成测验</option>
            <option value="incomplete">未完成测验</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>用户筛选</label>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
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
            <option value="">全部用户</option>
            {uniqueUsers.map(user => (
              <option key={user.username} value={user.username}>{user.name} ({user.username})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>日期筛选</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>搜索</label>
          <input
            type="text"
            placeholder="搜索用户或文章..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* 学习记录表格 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>工号</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>姓名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>部门</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>班组</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>工种</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>文章</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>学习时长</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>测验分数</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>完成状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>完成时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: '20px', textAlign: 'center' }}>
                  加载中...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '20px', textAlign: 'center' }}>
                  暂无学习记录
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      {record.employee_id || '-'}
                    </code>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <div>{record.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>@{record.username}</div>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{record.department || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{record.team || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{record.job_type || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <div>{record.articleTitle}</div>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    {record.studyDuration} 分钟
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    {record.score ? (
                      <span style={{
                        background: record.score >= 80 ? '#67c23a' : record.score >= 60 ? '#e6a23c' : '#f56c6c',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px'
                      }}>
                        {record.score}分
                      </span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>未完成</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <span style={{
                      background: record.quizCompleted ? '#67c23a' : '#909399',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px'
                    }}>
                      {record.quizCompleted ? '已完成' : '未完成'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    {new Date(record.completionTime).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 记录数量显示 */}
      <div style={{ 
        marginTop: '15px', 
        textAlign: 'center', 
        fontSize: '12px', 
        opacity: 0.7 
      }}>
        显示 {filteredRecords.length} 条记录，共 {records.length} 条
      </div>
    </div>
  );
};

export default LearningRecordManagement;