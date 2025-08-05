import React, { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const QuizDebug: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setQuestions(prev => [...prev, newQuestion]);
    addDebugInfo(`添加题目，当前题目数量: ${questions.length + 1}`);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    addDebugInfo(`删除题目 ${index + 1}，当前题目数量: ${questions.length - 1}`);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
    addDebugInfo(`更新题目 ${index + 1} 的 ${field}: ${value}`);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex ? {
        ...q,
        options: q.options.map((opt, j) => j === optionIndex ? value : opt)
      } : q
    ));
    addDebugInfo(`更新题目 ${questionIndex + 1} 的选项 ${optionIndex + 1}: ${value}`);
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1>🧪 题目功能调试</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 题目编辑区域 */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h2>题目编辑</h2>
          
          <div style={{ 
            border: '2px solid #67c23a', 
            borderRadius: '8px', 
            padding: '15px',
            marginBottom: '15px',
            background: 'rgba(103, 194, 58, 0.05)'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#67c23a' }}>
              📝 考试题目
            </h4>
            <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '15px' }}>
              添加考试题目，用户阅读完成后将随机抽取5道题进行作答
            </p>
            
            {/* 显示现有题目 */}
            {questions.map((question, questionIndex) => (
              <div key={question.id} style={{
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '12px',
                background: 'rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>题目 {questionIndex + 1}</span>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(questionIndex)}
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
                
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  题目内容：
                  <textarea
                    value={question.question}
                    onChange={e => updateQuestion(questionIndex, 'question', e.target.value)}
                    style={{ 
                      width: '100%', 
                      minHeight: 60, 
                      borderRadius: 6, 
                      border: '1px solid #ddd', 
                      marginTop: 4, 
                      resize: 'vertical',
                      padding: '8px'
                    }}
                    placeholder="请输入题目内容..."
                  />
                </label>
                
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>选项：</span>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        background: question.correctAnswer === optionIndex ? '#67c23a' : 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        marginRight: '8px',
                        cursor: 'pointer',
                        color: '#fff'
                      }}
                      onClick={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                      >
                        {question.correctAnswer === optionIndex ? '✓' : String.fromCharCode(65 + optionIndex)}
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={e => updateOption(questionIndex, optionIndex, e.target.value)}
                        style={{ 
                          flex: 1, 
                          padding: '6px 8px', 
                          borderRadius: 4, 
                          border: '1px solid #ddd',
                          background: '#fff',
                          color: '#000'
                        }}
                        placeholder={`选项 ${String.fromCharCode(65 + optionIndex)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* 显示题目数量信息 */}
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8, 
              marginBottom: '15px',
              textAlign: 'center',
              padding: '8px',
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '4px'
            }}>
              当前题目数量: {questions.length} 道
            </div>
            
            <button
              type="button"
              onClick={addQuestion}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(90deg, #67c23a 60%, #5daf34 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%',
                boxShadow: '0 4px 12px rgba(103, 194, 58, 0.3)'
              }}
            >
              ➕ 添加题目
            </button>
          </div>
        </div>
        
        {/* 调试信息区域 */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h2>调试信息</h2>
          <div style={{ 
            height: '400px', 
            overflowY: 'auto', 
            background: '#f8f8f8', 
            padding: '10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            {debugInfo.map((info, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>{info}</div>
            ))}
          </div>
          
          <button
            onClick={() => setDebugInfo([])}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#f56c6c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            清空调试信息
          </button>
        </div>
      </div>
      
      {/* 数据导出 */}
      <div style={{ marginTop: '20px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h2>数据导出</h2>
        <pre style={{ 
          background: '#f8f8f8', 
          padding: '10px', 
          borderRadius: '4px',
          overflowX: 'auto'
        }}>
          {JSON.stringify(questions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default QuizDebug; 