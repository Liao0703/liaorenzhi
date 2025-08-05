import React, { useState, useEffect } from 'react';
import { learningRecordAPI } from '../config/api';

interface LearningRecord {
  id: number;
  userId: number;
  username: string;
  name: string;
  articleId: string;
  articleTitle: string;
  score?: number;
  completionTime: string;
  studyDuration: number; // 学习时长（分钟）
  quizCompleted: boolean;
  createdAt: string;
  department?: string;
  team?: string;
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
      articleId: 'art001',
      articleTitle: '安全操作规程学习',
      score: 85,
      completionTime: '2024-01-15 14:30:00',
      studyDuration: 45,
      quizCompleted: true,
      createdAt: '2024-01-15 14:30:00',
      department: '机务段',
      team: 'A班组'
    },
    {
      id: 2,
      userId: 2,
      username: 'user002',
      name: '李四',
      articleId: 'art002',
      articleTitle: '应急处理流程',
      score: 92,
      completionTime: '2024-01-15 10:15:00',
      studyDuration: 38,
      quizCompleted: true,
      createdAt: '2024-01-15 10:15:00',
      department: '车务段',
      team: 'B班组'
    },
    {
      id: 3,
      userId: 3,
      username: 'user003',
      name: '王五',
      articleId: 'art001',
      articleTitle: '安全操作规程学习',
      completionTime: '2024-01-14 16:45:00',
      studyDuration: 25,
      quizCompleted: false,
      createdAt: '2024-01-14 16:45:00',
      department: '工务段',
      team: 'C班组'
    },
    {
      id: 4,
      userId: 1,
      username: 'user001',
      name: '张三',
      articleId: 'art003',
      articleTitle: '设备维护手册',
      score: 78,
      completionTime: '2024-01-14 09:20:00',
      studyDuration: 52,
      quizCompleted: true,
      createdAt: '2024-01-14 09:20:00',
      department: '机务段',
      team: 'A班组'
    },
    {
      id: 5,
      userId: 4,
      username: 'user004',
      name: '赵六',
      articleId: 'art002',
      articleTitle: '应急处理流程',
      score: 88,
      completionTime: '2024-01-13 15:30:00',
      studyDuration: 42,
      quizCompleted: true,
      createdAt: '2024-01-13 15:30:00',
      department: '电务段',
      team: 'D班组'
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

  // 导出学习记录
  const exportRecords = () => {
    const csv = [
      ['用户名', '姓名', '文章标题', '完成时间', '学习时长(分钟)', '测验分数', '测验完成', '部门', '班组'].join(','),
      ...filteredRecords.map(record => [
        record.username,
        record.name,
        record.articleTitle,
        record.completionTime,
        record.studyDuration,
        record.score || '未完成',
        record.quizCompleted ? '是' : '否',
        record.department || '',
        record.team || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `学习记录_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

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
            onClick={exportRecords}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(90deg,#67c23a 60%,#85ce61 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            📥 导出记录
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
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>用户</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>文章</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>学习时长</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>测验分数</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>完成状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>完成时间</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px' }}>部门/班组</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>
                  加载中...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>
                  暂无学习记录
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <div>{record.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>@{record.username}</div>
                  </td>
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
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    <div>{record.department || '-'}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>{record.team || '-'}</div>
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