import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleById } from './articleData';
import CameraCapture from './CameraCapture';
import { savePhoto, saveUserLearningRecord, getPhotosByUserId } from './photoStorage';
import { getSettings } from './settingsStorage';
import { getFilePreviewUrl } from './fileUploadService';
import { HybridStorageService } from './hybridStorageService';

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
  
  const intervalRef = useRef<number | null>(null);

  // 获取文章数据
  const article = getArticleById(id || '1');
  const requiredTime = article?.requiredReadingTime || 30;

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
  const handlePhotoTaken = (photoData: string) => {
    if (article) {
      // 保存照片到存储系统
      const photoRecord = savePhoto(
        photoData, 
        article.id, 
        article.title, 
        _user?.id?.toString() || '0', 
        _user?.name
      );
      
      setCapturedPhotos(prev => [...prev, photoData]);
      console.log('学习监控照片已保存:', photoRecord);
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
    
    // 保存用户学习记录
    if (_user) {
      const userPhotos = getPhotosByUserId(_user.id?.toString() || '0');
      const articlePhotos = userPhotos.filter(photo => photo.articleId === article.id);
      
      saveUserLearningRecord(
        _user.id?.toString() || '0',
        _user.name || '未知用户',
        article.id,
        article.title,
        Math.floor(readingTime / 60), // 转换为分钟
        finalScore,
        articlePhotos,
        finalScore >= 60 ? 'completed' : 'failed'
      );
      
      console.log('用户学习记录已保存');
    }
    
    setCurrentStep('completed');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!article) {
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
          <h2>文章不存在</h2>
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
      />
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

      {/* 计时器 */}
      {isTimerActive && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          padding: '8px 12px',
          borderRadius: '6px',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          minWidth: '100px',
          fontSize: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#409eff' }}>
              {formatTime(readingTime)}
            </div>
            <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '1px' }}>
              要求：{requiredTime}分钟
            </div>
            {!isPageVisible && (
              <div style={{ fontSize: '8px', color: '#ff6b6b', marginTop: '2px' }}>
                计时已暂停
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 'reading' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 200px',
          gridTemplateRows: isMobile ? '1fr auto' : 'auto',
          gap: isMobile ? '10px' : '15px',
          height: isMobile ? 'auto' : 'calc(100vh - 120px)',
          padding: isMobile ? '10px' : '0'
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
            order: isMobile ? 1 : 'auto',
            flex: '1'
          }}>
            {!isTimerActive ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '30px 0' : '50px 0' }}>
                <h3 style={{ marginBottom: '20px', fontSize: isMobile ? '18px' : '20px' }}>准备开始学习</h3>
                <p style={{ marginBottom: '30px', opacity: 0.8, fontSize: isMobile ? '14px' : '16px' }}>
                  本文要求阅读时长：{requiredTime}分钟<br />
                  请确保在阅读过程中不要切换页面或标签页
                </p>
                <button
                  onClick={startReading}
                  style={{
                    padding: isMobile ? '12px 25px' : '15px 30px',
                    background: 'linear-gradient(90deg,#409eff 60%,#2b8cff 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : '16px',
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
                    <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: isMobile ? '14px' : '15px' }}>📄 文件预览</h4>
                      <p style={{ margin: '0', fontSize: isMobile ? '12px' : '12px', opacity: '0.8' }}>
                        文件名: {article.fileName || '未知文件'}
                        {article.storageType && (
                          <span style={{ marginLeft: '6px', padding: '2px 4px', background: 'rgba(103, 194, 58, 0.2)', color: '#67c23a', borderRadius: '3px', fontSize: '9px' }}>
                            {article.storageType === 'hybrid' ? '混合存储' : article.storageType === 'local' ? '本地存储' : 'OSS存储'}
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: isMobile ? '60vh' : '80vh', 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {(() => {
                        let fileUrl = article.fileUrl;
                        if (article.fileId) {
                          const storageFile = HybridStorageService.getFile(article.fileId);
                          if (storageFile) {
                            fileUrl = HybridStorageService.getFileUrl(storageFile);
                          }
                        }
                        
                        if (!fileUrl) {
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              padding: '20px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>📄</div>
                              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>文件未找到</h3>
                              <p style={{ marginBottom: '20px', opacity: 0.8, fontSize: '14px' }}>
                                文件可能已被移动、修改或删除
                              </p>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button
                                  onClick={() => window.open(fileUrl || '', '_blank')}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'rgba(64, 158, 255, 0.8)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  在新窗口打开
                                </button>
                                <button
                                  onClick={() => {
                                    if (fileUrl) {
                                      const a = document.createElement('a');
                                      a.href = fileUrl;
                                      a.download = article.fileName || 'download';
                                      a.click();
                                    }
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    background: 'rgba(67, 194, 58, 0.8)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  下载文件
                                </button>
                              </div>
                            </div>
                          );
                        }
                        
                        const previewUrl = getFilePreviewUrl(fileUrl, article.fileType || 'pdf');
                        
                        return (
                          <>
                            <iframe
                              src={previewUrl}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                              }}
                              title={article.title}
                              onError={() => {
                                console.error('文件预览加载失败:', previewUrl);
                              }}
                            />
                            {/* 备用操作按钮 */}
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              display: 'flex',
                              gap: '5px'
                            }}>
                              <button
                                onClick={() => window.open(fileUrl || '', '_blank')}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  backdropFilter: 'blur(10px)'
                                }}
                                title="在新窗口打开"
                              >
                                🔗
                              </button>
                              <button
                                onClick={() => {
                                  if (fileUrl) {
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = article.fileName || 'download';
                                    a.click();
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  backdropFilter: 'blur(10px)'
                                }}
                                title="下载文件"
                              >
                                ⬇️
                              </button>
                            </div>
                          </>
                        );
                      })()}
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
            padding: isMobile ? '12px' : '15px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            height: 'fit-content',
            order: isMobile ? 2 : 'auto',
            minWidth: isMobile ? 'auto' : '180px'
          }}>
            <h3 style={{ 
              marginBottom: isMobile ? '8px' : '10px',
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 'bold'
            }}>学习提示</h3>
            <div style={{ 
              fontSize: isMobile ? '12px' : '12px', 
              lineHeight: isMobile ? '1.4' : '1.4',
              opacity: '0.9'
            }}>
              <p style={{ margin: isMobile ? '6px 0' : '6px 0' }}>📖 请仔细阅读文章内容</p>
              <p style={{ margin: isMobile ? '6px 0' : '6px 0' }}>⏱️ 阅读时长达到要求后才能答题</p>
              <p style={{ margin: isMobile ? '6px 0' : '6px 0' }}>🚫 请勿切换页面或标签页</p>
              <p style={{ margin: isMobile ? '6px 0' : '6px 0' }}>📝 阅读完成后将进行答题测试</p>
              <p style={{ margin: isMobile ? '6px 0' : '6px 0' }}>🎯 答题成绩将计入学习记录</p>
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