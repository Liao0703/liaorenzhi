import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleById } from './articleData';
import CameraCapture from './CameraCapture';
import CameraDiagnostic from './CameraDiagnostic';
import { savePhoto } from './photoStorage';
import { photoAPI } from './config/api';
import { getSettings } from './settingsStorage';
import { getFilePreviewUrl } from './fileUploadService';
import { apiClient } from './config/api';
// import { HybridStorageService } from './hybridStorageService';

interface ArticleReaderProps {
  user: any;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ user: _user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'reading' | 'quiz' | 'completed'>('reading');
  const [readingTime, setReadingTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [, setCapturedPhotos] = useState<string[]>([]);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const requiredTime = article?.requiredReadingTime || article?.required_reading_time || 30;

  // 全屏切换功能
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (iframeContainerRef.current) {
        iframeContainerRef.current.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(err => {
          console.error('无法进入全屏模式:', err);
        });
      }
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('无法退出全屏模式:', err);
      });
    }
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 获取文章数据 - 优先从API获取，失败则从本地获取
  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) {
        setError('文章ID无效');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 优先从API获取文章数据
        console.log('正在从API获取文章数据:', id);
        const response = await apiClient.get(`/articles/${id}`);
        
        if (response.success && response.data) {
          console.log('API获取文章成功:', response.data);
          
          // 转换服务器数据格式为前端格式
          const serverArticle = response.data;
          
          // 尝试从本地数据获取题目（如果存在）
          const localArticle = getArticleById(id);
          const questions = localArticle?.questions || [
            // 默认题目，用于所有文章
            {
              id: 1,
              question: '请确认您已经认真阅读了文章内容？',
              options: [
                'A. 是的，我已认真阅读',
                'B. 部分阅读',
                'C. 没有阅读',
                'D. 跳过阅读'
              ],
              correctAnswer: 0
            },
            {
              id: 2,
              question: '您对文章内容的理解程度如何？',
              options: [
                'A. 完全理解',
                'B. 大部分理解',
                'C. 部分理解',
                'D. 不太理解'
              ],
              correctAnswer: 0
            }
          ];
          
          const formattedArticle = {
            id: serverArticle.id?.toString(),
            title: serverArticle.title,
            content: serverArticle.content || '',
            category: serverArticle.category || '未分类',
            requiredReadingTime: serverArticle.required_reading_time || 30,
            questions: questions,
            fileType: serverArticle.file_type || 'none',
            fileUrl: serverArticle.file_url,
            fileName: serverArticle.file_name,
            fileId: serverArticle.file_id,
            storageType: serverArticle.storage_type || 'local'
          };
          
          setArticle(formattedArticle);
          setLoading(false);
          return;
        } else {
          throw new Error(response.error || '获取文章失败');
        }
      } catch (error) {
        console.warn('API获取文章失败，尝试从本地获取:', error);
        
        // API失败时，尝试从本地数据获取
        const localArticle = getArticleById(id);
        if (localArticle) {
          console.log('从本地获取文章成功:', localArticle.title);
          setArticle(localArticle);
          setLoading(false);
        } else {
          console.error('本地也没有找到文章:', id);
          setError('文章不存在');
          setLoading(false);
        }
      }
    };

    fetchArticle();
  }, [id]);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 页面可见性检测
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 计时器逻辑
  useEffect(() => {
    if (isTimerActive && isPageVisible) {
      intervalRef.current = window.setInterval(() => {
        setReadingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= requiredTime * 60) {
            setShowQuiz(true);
            setIsTimerActive(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
          return newTime;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerActive, isPageVisible, requiredTime]);

  const startReading = () => {
    setIsTimerActive(true);
  };

  // 处理拍照回调
  const handlePhotoTaken = async (photoData: string) => {
    if (!article) return;

    // 1) 本地缓存一份，防止网络失败丢失
    const photoRecord = savePhoto(
      photoData,
      article.id,
      article.title,
      _user?.id?.toString() || '0',
      _user?.name
    );
    setCapturedPhotos(prev => [...prev, photoData]);

    // 2) 同步到云端
    try {
      const userIdNum = Number(_user?.id || 0) || 1;
      const articleIdNum = Number(article.id);
      if (!Number.isFinite(articleIdNum) || articleIdNum <= 0) {
        console.warn('跳过云端同步：文章未在云端建档，保持本地缓存');
        return;
      }
      const res = await photoAPI.create({
        user_id: userIdNum,
        article_id: articleIdNum,
        photo_data: photoData,
        file_name: 'capture.jpg'
      });
      if (res && res.success) {
        console.log('✅ 照片已同步云数据库', res.data);
      } else {
        console.warn('⚠️ 照片云端同步失败，将保留本地缓存', res?.error || 'unknown');
      }
    } catch (err) {
      console.warn('⚠️ 照片云端同步异常，将保留本地缓存', err);
    }
  };

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionId] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitQuiz = () => {
    if (!article) return;
    
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer === article.questions[index].correctAnswer) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / article.questions.length) * 100);
    setScore(finalScore);
    setCurrentStep('completed');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        padding: '20px',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <h2>正在加载文章...</h2>
          <p style={{ opacity: 0.7, fontSize: '14px' }}>请稍候</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !article) {
    return (
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        padding: '20px',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2>{error || '文章不存在'}</h2>
          <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '20px' }}>
            {error ? '请检查网络连接或稍后重试' : '请确认文章ID是否正确'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              重新加载
            </button>
            <button
              onClick={() => navigate('/articles')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              返回文章列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'relative', 
      zIndex: 10, 
      padding: isMobile ? '15px' : '20px',
      color: '#fff',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* 摄像头拍照组件 */}
      <CameraCapture
        isActive={isTimerActive && currentStep === 'reading'}
        onPhotoTaken={handlePhotoTaken}
        interval={getSettings().cameraInterval} // 使用系统设置的拍照间隔
        enableRandomCapture={getSettings().enableRandomCapture}
        randomCaptureCount={getSettings().randomCaptureCount}
        enableAntiCheating={getSettings().enableAntiCheating}
        onAntiCheatingAlert={() => {
          alert('⚠️ 防代学检测：未检测到学习者本人\n\n请确保您本人坐在摄像头前进行学习。\n学习进度已暂停，请调整位置后继续。');
        }}
      />
      
      {/* 摄像头诊断工具 */}
      {showDiagnostic && (
        <CameraDiagnostic onClose={() => setShowDiagnostic(false)} />
      )}
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: isMobile ? '15px' : '20px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>{article.title}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowDiagnostic(true)}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            📷 摄像头诊断
          </button>
          <button
            onClick={() => navigate('/articles')}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            返回列表
          </button>
        </div>
      </div>

      {/* 计时器 */}
      {isTimerActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#409eff' }}>
              {formatTime(readingTime)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              要求时长：{requiredTime}分钟
            </div>
            {!isPageVisible && (
              <div style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '5px' }}>
                页面不可见，计时已暂停
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 'reading' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 250px',
          gridTemplateRows: isMobile ? '1fr auto' : 'auto',
          gap: isMobile ? '10px' : '15px',
          height: isMobile ? 'auto' : 'calc(100vh - 80px)'
        }}>
          {/* 文章内容 */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            overflowY: 'auto',
            lineHeight: '1.8',
            minHeight: isMobile ? '70vh' : 'auto',
            order: isMobile ? 1 : 'auto'
          }}>
            {!isTimerActive ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <h3 style={{ marginBottom: '20px' }}>准备开始学习</h3>
                <p style={{ marginBottom: '30px', opacity: 0.8 }}>
                  本文要求阅读时长：{requiredTime}分钟<br />
                  请确保在阅读过程中不要切换页面或标签页
                </p>
                <button
                  onClick={startReading}
                  style={{
                    padding: '15px 30px',
                    background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  开始阅读
                </button>
              </div>
            ) : (
              <div>
                {/* 文件型文章预览 */}
                {article.fileType && article.fileType !== 'none' && (article.fileUrl || article.fileId) ? (
                  <div>
                    <div style={{ marginBottom: '10px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px' }}>📄</span>
                        <span style={{ fontSize: '14px', opacity: '0.9' }}>
                          {article.fileName || '未知文件'}
                        </span>
                      </div>
                      {article.storageType && (
                        <span style={{ padding: '2px 8px', background: 'rgba(103, 194, 58, 0.2)', color: '#67c23a', borderRadius: '4px', fontSize: '11px' }}>
                          {article.storageType === 'hybrid' ? '混合存储' : article.storageType === 'local' ? '本地存储' : 'OSS存储'}
                        </span>
                      )}
                    </div>
                    <div 
                      ref={iframeContainerRef}
                      style={{ 
                        width: '100%', 
                        height: isFullscreen ? '100vh' : (isMobile ? '75vh' : '85vh'), 
                        minHeight: isMobile ? '400px' : '600px',
                        maxHeight: isFullscreen ? '100vh' : (isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 150px)'),
                        border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.2)', 
                        borderRadius: isFullscreen ? '0' : '8px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        position: 'relative',
                        background: isFullscreen ? '#fff' : 'transparent'
                      }}
                    >
                      {/* 全屏切换按钮 */}
                      <button
                        onClick={toggleFullscreen}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          zIndex: 10,
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title={isFullscreen ? '退出全屏' : '全屏阅读'}
                      >
                        {isFullscreen ? '🔲 退出全屏' : '🔳 全屏阅读'}
                      </button>
                      <iframe
                        src={(() => {
                          let fileUrl = article.fileUrl;
                          
                          // 如果有file_name，使用服务器的文件下载接口
                          if (article.fileName) {
                            fileUrl = `${window.location.origin}/api/files/download/${article.fileName}`;
                          } else if (article.fileId) {
                            // 兼容旧版本的fileId
                            fileUrl = `${window.location.origin}/api/files/download/${article.fileId}`;
                          }
                          
                          return fileUrl ? getFilePreviewUrl(fileUrl, article.fileType || 'pdf') : '';
                        })()}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        title={article.title}
                      />
                    </div>
                  </div>
                ) : (
                  /* 普通文本文章 */
                  <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }} />
                )}
              </div>
            )}
          </div>

          {/* 学习提示 */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            height: 'fit-content',
            order: isMobile ? 2 : 'auto'
          }}>
            <h3 style={{ 
              marginBottom: isMobile ? '10px' : '15px',
              fontSize: isMobile ? '16px' : '18px'
            }}>学习提示</h3>
            <div style={{ 
              fontSize: isMobile ? '13px' : '14px', 
              lineHeight: isMobile ? '1.5' : '1.6'
            }}>
              <p>📖 请仔细阅读文章内容</p>
              <p>⏱️ 阅读时长达到要求后才能答题</p>
              <p>🚫 请勿切换页面或标签页</p>
              <p>📝 阅读完成后将进行答题测试</p>
              <p>🎯 答题成绩将计入学习记录</p>
            </div>
          </div>
        </div>
      )}

      {showQuiz && currentStep === 'reading' && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: isMobile ? '20px' : '30px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          marginTop: isMobile ? '15px' : '20px'
        }}>
          <h3 style={{ 
            marginBottom: isMobile ? '15px' : '20px', 
            textAlign: 'center',
            fontSize: isMobile ? '18px' : '20px'
          }}>学习测试</h3>
          <p style={{ 
            marginBottom: isMobile ? '20px' : '30px', 
            textAlign: 'center', 
            opacity: 0.8,
            fontSize: isMobile ? '14px' : '16px'
          }}>
            阅读完成！请回答以下问题以检验学习效果
          </p>
          
          {article.questions.map((question, index) => (
            <div key={question.id} style={{ 
              marginBottom: isMobile ? '20px' : '25px'
            }}>
              <h4 style={{ 
                marginBottom: isMobile ? '12px' : '15px',
                fontSize: isMobile ? '16px' : '18px'
              }}>{index + 1}. {question.question}</h4>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? '8px' : '10px'
              }}>
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: isMobile ? '8px' : '10px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: isMobile ? '14px' : '16px'
                  }}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={optionIndex}
                      checked={answers[index] === optionIndex}
                      onChange={() => handleAnswerChange(index, optionIndex)}
                      style={{ marginRight: '10px' }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              onClick={submitQuiz}
              disabled={answers.length < article.questions.length}
              style={{
                padding: isMobile ? '12px 24px' : '15px 30px',
                background: answers.length < article.questions.length 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'linear-gradient(90deg,#67c23a 60%,#5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: answers.length < article.questions.length ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 'bold'
              }}
            >
              提交答案
            </button>
          </div>
        </div>
      )}

      {currentStep === 'completed' && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: isMobile ? '30px 20px' : '40px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            marginBottom: isMobile ? '15px' : '20px', 
            color: score >= 80 ? '#67c23a' : '#e6a23c',
            fontSize: isMobile ? '20px' : '24px'
          }}>
            学习完成！
          </h2>
          <div style={{ 
            fontSize: isMobile ? '36px' : '48px', 
            fontWeight: 'bold', 
            marginBottom: isMobile ? '15px' : '20px', 
            color: '#409eff'
          }}>
            {score}分
          </div>
          <p style={{ 
            marginBottom: isMobile ? '20px' : '30px', 
            opacity: 0.8,
            fontSize: isMobile ? '14px' : '16px'
          }}>
            阅读时长：{formatTime(readingTime)} | 答题正确率：{score}%
          </p>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '10px' : '15px', 
            justifyContent: 'center',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <button
              onClick={() => navigate('/articles')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              返回学习列表
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
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
      )}
    </div>
  );
};

export default ArticleReader; 