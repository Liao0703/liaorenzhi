// 统一排行榜数据来源（登录页与概览页共用）

export interface UserRankData {
  id: number;
  name: string;
  averageScore: number;
  unit: string;
  team: string;
}

const getApiBase = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (
    hostname === '116.62.65.246' ||
    hostname === 'www.liaorenzhi.top' ||
    hostname === 'liaorenzhi.top' ||
    hostname.includes('vercel.app')
  ) {
    return 'http://116.62.65.246:3001';
  }
  return 'http://localhost:3001';
};

export const getLeaderboardData = async (): Promise<UserRankData[]> => {
  try {
    // 预留真实接口
    // const resp = await fetch(`${getApiBase()}/api/leaderboard/top10`);
    // if (resp.ok) {
    //   const data = await resp.json();
    //   return data.users as UserRankData[];
    // }
  } catch (error) {
    // ignore and fallback to mock
  }

  // 模拟数据（与登录页保持一致）
  const mockUsers: UserRankData[] = [
    { id: 3, name: '王五', averageScore: 92, unit: '兴隆场车站', team: '运转一班' },
    { id: 5, name: '孙七', averageScore: 90, unit: '兴隆场车站', team: '运转四班' },
    { id: 4, name: '赵六', averageScore: 88, unit: '兴隆场车站', team: '运转三班' },
    { id: 7, name: '吴九', averageScore: 86, unit: '兴隆场车站', team: '运转三班' },
    { id: 1, name: '张三', averageScore: 85, unit: '兴隆场车站', team: '运转一班' },
    { id: 6, name: '周八', averageScore: 82, unit: '兴隆场车站', team: '运转二班' },
    { id: 8, name: '郑十', averageScore: 79, unit: '兴隆场车站', team: '运转四班' },
    { id: 2, name: '李四', averageScore: 78, unit: '兴隆场车站', team: '运转二班' },
    { id: 9, name: '陈一', averageScore: 76, unit: '兴隆场车站', team: '运转一班' },
    { id: 10, name: '林二', averageScore: 74, unit: '兴隆场车站', team: '运转二班' }
  ];

  return mockUsers;
};


