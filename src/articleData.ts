import type { JobType } from './config/jobTypes';

// 文章数据存储 - 模拟数据库
export interface ArticleData {
  id: string;
  title: string;
  content: string;
  category: string;
  requiredReadingTime: number; // 分钟
  questions: Question[];
  fileType?: 'pdf' | 'word' | 'none'; // 文件类型
  fileUrl?: string; // OSS文件URL
  fileName?: string; // 原始文件名
  fileId?: string; // 混合存储文件ID
  storageType?: 'local' | 'oss' | 'hybrid'; // 存储类型
  allowedJobTypes?: JobType[]; // 允许访问的工种，为空表示所有工种都可以访问
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

// 从localStorage加载文章数据
const loadArticlesFromStorage = (): ArticleData[] => {
  try {
    const stored = localStorage.getItem('learning_articles');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('加载文章数据失败:', error);
  }
  return [];
};

// 保存文章数据到localStorage
const saveArticlesToStorage = (articles: ArticleData[]) => {
  try {
    localStorage.setItem('learning_articles', JSON.stringify(articles));
  } catch (error) {
    console.error('保存文章数据失败:', error);
  }
};

// 初始文章数据
let articlesData: ArticleData[] = loadArticlesFromStorage();

// 如果没有数据，使用默认数据
if (articlesData.length === 0) {
  articlesData = [
  {
    id: "1",
    title: '铁路安全操作规程',
    category: '安全规程',
    requiredReadingTime: 30,
    content: `
# 铁路安全操作规程

## 第一章 总则

第一条 为了加强铁路安全管理，规范操作行为，确保铁路运输安全，根据《中华人民共和国安全生产法》等法律法规，制定本规程。

第二条 本规程适用于铁路运输企业及其从业人员的安全操作活动。

## 第二章 基本要求

### 第一节 人员要求

第三条 铁路从业人员应当具备相应的安全知识和操作技能，经过安全培训并考核合格后方可上岗。

第四条 从业人员应当严格遵守安全操作规程，不得违章作业。

第五条 从业人员发现安全隐患或者发生事故时，应当立即报告，并采取有效措施防止事故扩大。

### 第二节 设备要求

第六条 铁路设备应当符合国家规定的安全技术标准，并定期进行检查、维护和保养。

第七条 设备出现故障时，应当立即停止使用，并及时进行维修。

第八条 新设备投入使用前，应当进行安全性能检测和验收。

## 第三章 操作规范

### 第一节 列车运行

第九条 列车运行前，应当对车辆、信号、线路等设备进行全面检查。

第十条 列车运行中，应当严格遵守信号指示和速度限制。

第十一条 遇到异常情况时，应当立即采取紧急制动措施。

### 第二节 信号操作

第十二条 信号操作人员应当严格按照信号操作规程进行操作。

第十三条 信号设备出现故障时，应当立即报告并采取应急措施。

第十四条 信号显示异常时，应当立即停止相关作业。

## 第四章 应急处理

### 第一节 事故处理

第十五条 发生事故时，应当立即启动应急预案。

第十六条 事故现场应当设置警示标志，防止次生事故。

第十七条 事故调查应当按照规定程序进行，查明原因并制定防范措施。

### 第二节 应急救援

第十八条 应急救援队伍应当定期进行培训和演练。

第十九条 应急救援设备应当保持完好状态，确保随时可用。

第二十条 应急救援行动应当统一指挥，协调配合。

## 第五章 监督检查

第二十一条 铁路运输企业应当建立安全监督检查制度。

第二十二条 监督检查人员应当具备相应的专业知识和技能。
`,
    questions: [
      {
        id: 1,
        question: '铁路从业人员上岗前需要具备什么条件？',
        options: [
          'A. 具备相应的安全知识和操作技能，经过安全培训并考核合格',
          'B. 只需要有工作经验即可',
          'C. 只需要身体健康即可',
          'D. 不需要任何条件'
        ],
        correctAnswer: 0
      },
      {
        id: 2,
        question: '列车运行前应当对哪些设备进行检查？',
        options: [
          'A. 只检查车辆',
          'B. 只检查信号',
          'C. 对车辆、信号、线路等设备进行全面检查',
          'D. 不需要检查任何设备'
        ],
        correctAnswer: 2
      },
      {
        id: 3,
        question: '发生事故时应当采取什么措施？',
        options: [
          'A. 立即启动应急预案',
          'B. 等待上级指示',
          'C. 隐瞒不报',
          'D. 继续正常工作'
        ],
        correctAnswer: 0
      }
    ]
  },
  {
    id: "2",
    title: '设备维护保养指南',
    category: '设备维护',
    requiredReadingTime: 45,
    content: '设备维护保养指南内容...',
    questions: [
      {
        id: 1,
        question: '设备维护的基本要求是什么？',
        options: [
          'A. 定期检查和保养',
          'B. 只在故障时维修',
          'C. 不需要维护',
          'D. 随意处理'
        ],
        correctAnswer: 0
      }
    ]
  },
  {
    id: "3",
    title: '应急处理流程',
    category: '应急处理',
    requiredReadingTime: 25,
    content: '应急处理流程内容...',
    questions: [
      {
        id: 1,
        question: '应急处理的首要原则是什么？',
        options: [
          'A. 确保人员安全',
          'B. 保护设备',
          'C. 节省成本',
          'D. 快速处理'
        ],
        correctAnswer: 0
      }
    ]
  }
];
}

// 获取文章数据
export const getArticleById = (id: string): ArticleData | undefined => {
  return articlesData.find(article => article.id === id);
};

// 更新文章数据（支持云端同步）
export const updateArticle = async (updatedArticle: ArticleData, syncToCloud: boolean = true) => {
  const index = articlesData.findIndex(article => article.id === updatedArticle.id);
  if (index !== -1) {
    articlesData[index] = updatedArticle;
    saveArticlesToStorage(articlesData);
    
    // 同步到云端
    if (syncToCloud) {
      try {
        const { CloudArticleService } = await import('./cloudDataService');
        await CloudArticleService.updateArticle(updatedArticle);
        console.log('✅ 文章已同步到云端:', updatedArticle.title);
      } catch (error) {
        console.warn('⚠️ 云端同步失败，仅保存到本地:', error);
      }
    }
  }
};

// 添加新文章（支持云端同步）
export const addArticle = async (article: Omit<ArticleData, 'id'>, syncToCloud: boolean = true) => {
  let newArticle: ArticleData;
  
  if (syncToCloud) {
    try {
      // 优先添加到云端，获取服务器生成的ID
      const { CloudArticleService } = await import('./cloudDataService');
      newArticle = await CloudArticleService.addArticle(article);
      console.log('✅ 文章已添加到云端:', newArticle.title);
    } catch (error) {
      console.warn('⚠️ 云端添加失败，仅保存到本地:', error);
      // 云端失败时使用本地生成ID
      newArticle = {
        ...article,
        id: (Math.max(...articlesData.map(a => parseInt(a.id) || 0)) + 1).toString()
      };
    }
  } else {
    // 仅本地添加
    newArticle = {
    ...article,
      id: (Math.max(...articlesData.map(a => parseInt(a.id) || 0)) + 1).toString()
  };
  }
  
  // 更新本地数据
  articlesData.push(newArticle);
  saveArticlesToStorage(articlesData);
  return newArticle;
};

// 删除文章（支持云端同步）
export const deleteArticle = async (id: string, syncToCloud: boolean = true) => {
  const index = articlesData.findIndex(article => article.id === id);
  if (index !== -1) {
    const articleTitle = articlesData[index].title;
    articlesData.splice(index, 1);
    saveArticlesToStorage(articlesData);
    
    // 同步到云端
    if (syncToCloud) {
      try {
        const { CloudArticleService } = await import('./cloudDataService');
        await CloudArticleService.deleteArticle(id);
        console.log('✅ 文章已从云端删除:', articleTitle);
      } catch (error) {
        console.warn('⚠️ 云端删除失败，仅从本地删除:', error);
      }
    }
  }
};

// 从云端同步文章数据
export const syncFromCloud = async (): Promise<{
  success: boolean;
  count: number;
  message: string;
}> => {
  try {
    const { CloudArticleService } = await import('./cloudDataService');
    const cloudArticles = await CloudArticleService.getAllArticles();
    
    // 更新本地数据
    articlesData.length = 0; // 清空现有数据
    articlesData.push(...cloudArticles);
    saveArticlesToStorage(articlesData);
    
    return {
      success: true,
      count: cloudArticles.length,
      message: `成功从云端同步 ${cloudArticles.length} 篇文章`
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      message: error instanceof Error ? error.message : '同步失败'
    };
  }
};

// 将本地文章同步到云端
export const syncToCloud = async (): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> => {
  try {
    const { CloudArticleService } = await import('./cloudDataService');
    return await CloudArticleService.syncLocalToCloud(articlesData);
  } catch (error) {
    return {
      success: 0,
      failed: articlesData.length,
      errors: [error instanceof Error ? error.message : '同步服务不可用']
    };
  }
};

// 获取所有文章
export const getAllArticles = () => {
  return [...articlesData];
}; 