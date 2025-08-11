import React, { useState, useEffect } from 'react';
import { getLeaderboardData } from '../leaderboardService';

interface UserRankData {
  id: number;
  name: string;
  averageScore: number;
  unit: string;
  team: string;
}

interface LeaderBoardProps {
  currentUser?: any;
  position?: 'login' | 'default';
}

const LeaderBoard: React.FC<LeaderBoardProps> = ({ currentUser, position = 'default' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topUsers, setTopUsers] = useState<UserRankData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取排行榜数据
  const fetchLeaderboardData = async () => {
    try {
      const users = await getLeaderboardData();
      setTopUsers(users);
      setIsLoading(false);
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      setIsLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // 定期刷新排行榜数据（每5分钟）
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchLeaderboardData();
    }, 5 * 60 * 1000); // 5分钟

    return () => clearInterval(refreshInterval);
  }, []);

  // 自动滚动效果
  useEffect(() => {
    if (topUsers.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % topUsers.length);
    }, 3000); // 每3秒切换一次

    return () => clearInterval(interval);
  }, [topUsers.length]);

  // 获取当前显示的用户
  const getCurrentUser = () => {
    return topUsers[currentIndex];
  };

  // 获取排名
  const getRank = () => {
    return currentIndex + 1;
  };

  // 获取奖牌图标
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏆';
    }
  };

  // 获取成绩颜色
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#f56565'; // 红色 - 优秀
    if (score >= 85) return '#ed8936'; // 橙色 - 良好
    if (score >= 80) return '#ecc94b'; // 黄色 - 中等
    return '#68d391'; // 绿色 - 及格
  };

  // 如果正在加载或没有数据，显示加载状态
  if (isLoading || topUsers.length === 0) {
    return (
      <div
        style={{
          position: 'fixed',
          ...(position === 'login' ? {
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
          } : {
            left: '20px',
            bottom: '80px',
          }),
          width: position === 'login' ? '320px' : '280px',
          height: position === 'login' ? '140px' : '120px',
          background: position === 'login' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          padding: '15px',
          color: '#fff',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
          🏆 学习排行榜
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          {isLoading ? '加载中...' : '暂无数据'}
        </div>
      </div>
    );
  }

  const currentUser_ = getCurrentUser();
  const rank = getRank();

  return (
    <div
      style={{
        position: 'fixed',
        ...(position === 'login' ? {
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
        } : {
          left: '20px',
          bottom: '80px',
        }), // 避开版权信息栏
        width: position === 'login' ? '320px' : '280px',
        height: position === 'login' ? '140px' : '120px',
        background: position === 'login' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        padding: '15px',
        color: '#fff',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
    >
      {/* 标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🏆</span>
          <span>学习排行榜</span>
        </div>
        <div
          style={{
            fontSize: '12px',
            opacity: 0.7,
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 8px',
            borderRadius: '10px'
          }}
        >
          TOP 10
        </div>
      </div>

      {/* 用户信息卡片 */}
      <div
        key={currentUser_.id}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          borderRadius: '10px',
          padding: '12px',
          animation: 'slideIn 0.5s ease-out',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* 左侧：排名和用户信息 */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <span style={{ fontSize: '18px' }}>{getMedalIcon(rank)}</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>第{rank}名</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '3px' }}>
              {currentUser_.name}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>
              {currentUser_.team}
            </div>
          </div>

          {/* 右侧：成绩 */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: getScoreColor(currentUser_.averageScore)
              }}
            >
              {currentUser_.averageScore}分
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              平均成绩
            </div>
          </div>
        </div>
      </div>

      {/* 进度指示器 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3px',
          marginTop: '8px'
        }}
      >
        {topUsers.map((_, index) => (
          <div
            key={index}
            style={{
              width: index === currentIndex ? '16px' : '6px',
              height: '3px',
              background: index === currentIndex ? '#4ade80' : 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* CSS动画 */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LeaderBoard;