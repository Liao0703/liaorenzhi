// 工种配置
export const JOB_TYPES = [
  '车站值班员',
  '助理值班员（内勤）', 
  '助理值班员（外勤）',
  '连结员',
  '调车长',
  '列尾作业员',
  '站调',
  '车号员'
] as const;

export type JobType = typeof JOB_TYPES[number];

// 工种分组配置，用于界面展示分类
export const JOB_TYPE_GROUPS = {
  '值班管理': ['车站值班员', '助理值班员（内勤）', '助理值班员（外勤）'],
  '调车作业': ['连结员', '调车长', '列尾作业员'],
  '调度管理': ['站调', '车号员']
} as const;

// 获取工种的显示名称
export const getJobTypeDisplayName = (jobType: string): string => {
  return jobType;
};

// 获取工种所属的分组
export const getJobTypeGroup = (jobType: string): string | null => {
  for (const [group, types] of Object.entries(JOB_TYPE_GROUPS)) {
    if (types.includes(jobType as any)) {
      return group;
    }
  }
  return null;
};

// 检查工种是否有效
export const isValidJobType = (jobType: string): jobType is JobType => {
  return JOB_TYPES.includes(jobType as any);
};

// 获取所有工种选项
export const getAllJobTypes = (): JobType[] => {
  return [...JOB_TYPES];
};

// 管理端使用的公共选项（单位/部门/班组）
export const UNITS = ['兴隆场车站'] as const;
export const DEPARTMENTS = [
  '团结村车站',
  '白市驿车站',
  '陶家场线路所',
  '铜罐驿车站',
  '石场车站',
  '中梁山',
  '跳蹬车站',
  '珞璜车站',
  '小南海车站',
  '伏牛溪车站',
  '茄子溪车站',
  '大渡口车站',
  '重庆南车站'
] as const;
export const TEAMS = ['运转一班', '运转二班', '运转三班', '运转四班'] as const;





