import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';

// 配置PDF.js使用主线程
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  content: string;
  questions?: any[];
}

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'PDF文档',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word文档 (.docx)',
  'application/msword': 'Word文档 (.doc)',
  'text/plain': '文本文件 (.txt)',
  'text/html': 'HTML文件 (.html)',
  'application/json': 'JSON文件 (.json)'
};

// 检查文件类型是否支持
export const isFileTypeSupported = (fileType: string): boolean => {
  return Object.keys(SUPPORTED_FILE_TYPES).includes(fileType);
};

// 获取文件类型描述
export const getFileTypeDescription = (fileType: string): string => {
  return SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES] || '未知文件类型';
};

// 处理PDF文件（暂时简化处理）
export const processPDFFile = async (file: File): Promise<FileInfo> => {
  try {
    // 暂时返回文件信息，提示用户PDF功能正在开发中
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      content: `PDF文件: ${file.name}\n\nPDF文本提取功能正在开发中，请暂时使用Word文档或文本文件。\n\n文件大小: ${formatFileSize(file.size)}`
    };
  } catch (error) {
    console.error('PDF处理失败:', error);
    throw new Error(`PDF文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 处理Word文档
export const processWordFile = async (file: File): Promise<FileInfo> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      content: result.value
    };
  } catch (error) {
    console.error('Word文档处理失败:', error);
    throw new Error(`Word文档处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 处理文本文件
export const processTextFile = async (file: File): Promise<FileInfo> => {
  try {
    const text = await file.text();
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      content: text
    };
  } catch (error) {
    console.error('文本文件处理失败:', error);
    throw new Error(`文本文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 处理HTML文件
export const processHTMLFile = async (file: File): Promise<FileInfo> => {
  try {
    const html = await file.text();
    
    // 创建临时DOM元素来提取纯文本
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      content: textContent.trim()
    };
  } catch (error) {
    console.error('HTML文件处理失败:', error);
    throw new Error(`HTML文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 处理JSON文件
export const processJSONFile = async (file: File): Promise<FileInfo> => {
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    
    // 如果是文章格式的JSON，直接返回
    if (jsonData.content) {
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        content: jsonData.content,
        questions: jsonData.questions || []
      };
    }
    
    // 否则将整个JSON转换为文本
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      content: JSON.stringify(jsonData, null, 2)
    };
  } catch (error) {
    console.error('JSON文件处理失败:', error);
    throw new Error(`JSON文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 统一文件处理函数
export const processFile = async (file: File): Promise<FileInfo> => {
  if (!isFileTypeSupported(file.type)) {
    throw new Error(`不支持的文件类型: ${file.type}`);
  }
  
  switch (file.type) {
    case 'application/pdf':
      return await processPDFFile(file);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return await processWordFile(file);
    case 'text/plain':
      return await processTextFile(file);
    case 'text/html':
      return await processHTMLFile(file);
    case 'application/json':
      return await processJSONFile(file);
    default:
      throw new Error(`未处理的文件类型: ${file.type}`);
  }
};

// 生成默认问题
export const generateDefaultQuestions = (content: string): any[] => {
  // 简单的基于内容生成问题
  const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
  const questions = [];
  
  // 取前3个句子生成问题
  for (let i = 0; i < Math.min(3, sentences.length); i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 20) {
      questions.push({
        id: i + 1,
        question: `关于"${sentence.substring(0, 20)}..."的说法，以下哪项是正确的？`,
        options: [
          '正确',
          '错误',
          '需要进一步确认',
          '以上都不对'
        ],
        correctAnswer: 0
      });
    }
  }
  
  return questions;
};

// 导出文件
export const exportFile = (content: string, fileName: string, fileType: string = 'text/plain') => {
  const blob = new Blob([content], { type: fileType });
  saveAs(blob, fileName);
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 