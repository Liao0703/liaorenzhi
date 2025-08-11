import React, { useState, useEffect } from 'react';
import { maintenanceService } from './maintenanceService';
import type { MaintenanceConfig } from './maintenanceService';
import ServerStatusPanel from './ServerStatusPanel';

interface MaintenancePanelProps {
  user: any;
}

const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'server-status'>('maintenance');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceConfig | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceConfig[]>([]);
  const [showEnableForm, setShowEnableForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    message: ''
  });

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = () => {
    const isEnabled = maintenanceService.isMaintenanceMode();
    const info = maintenanceService.getMaintenanceInfo();
    const history = maintenanceService.getMaintenanceHistory();
    
    setIsMaintenanceMode(isEnabled);
    setMaintenanceInfo(info);
    setMaintenanceHistory(history);
  };

  const handleEnableMaintenance = () => {
    if (!formData.reason.trim() || !formData.message.trim()) {
      alert('请填写完整的维护信息');
      return;
    }

    maintenanceService.enableMaintenance({
      reason: formData.reason.trim(),
      message: formData.message.trim(),
      enabledBy: user.name || user.username,
      startTime: new Date().toISOString()
    });

    setFormData({ reason: '', message: '' });
    setShowEnableForm(false);
    loadMaintenanceData();
  };

  const handleDisableMaintenance = () => {
    if (window.confirm('确定要禁用维护模式吗？')) {
      maintenanceService.disableMaintenance(user.name || user.username);
      loadMaintenanceData();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}小时${minutes}分钟`;
  };

  return (
    <div style={{ background: 'transparent', padding: 0, color: '#111827' }}>
      <div style={{ background: '#fff', border: '1px solid #eef0f4', borderRadius: 16, boxShadow: '0 6px 24px rgba(17,24,39,0.06)', padding: 20, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🔧 维护人员后台管理</h2>
      </div>

      {/* 标签页导航 */}
      <div style={{ background: '#fff', border: '1px solid #eef0f4', borderRadius: 12, boxShadow: '0 6px 24px rgba(17,24,39,0.06)', padding: 6, display: 'flex', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            padding: '10px 16px',
            background: activeTab === 'maintenance' ? '#111827' : 'transparent',
            color: activeTab === 'maintenance' ? '#fff' : '#111827',
            border: '1px solid',
            borderColor: activeTab === 'maintenance' ? '#111827' : 'transparent',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          🛠️ 维护模式管理
        </button>
        <button
          onClick={() => setActiveTab('server-status')}
          style={{
            padding: '10px 16px',
            background: activeTab === 'server-status' ? '#111827' : 'transparent',
            color: activeTab === 'server-status' ? '#fff' : '#111827',
            border: '1px solid',
            borderColor: activeTab === 'server-status' ? '#111827' : '透明',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          🌐 服务器状态监控
        </button>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'maintenance' ? (
        <div>
          <div style={{ background: '#fff', border: '1px solid #eef0f4', borderRadius: 16, boxShadow: '0 6px 24px rgba(17,24,39,0.06)', padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🛠️ 维护模式管理</h3>
          </div>

          {/* 当前状态 */}
          <div style={{ background: '#fff', border: '1px solid #eef0f4', borderRadius: 16, boxShadow: '0 6px 24px rgba(17,24,39,0.06)', padding: 16, marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <strong style={{ color: isMaintenanceMode ? '#d97706' : '#059669', fontSize: 16 }}>
                  {isMaintenanceMode ? '🛠️ 系统维护中' : '✅ 系统正常运行'}
                </strong>
                {maintenanceInfo && (
                  <div style={{ marginTop: 8, fontSize: 14, color: '#334155' }}>
                    维护原因: {maintenanceInfo.reason}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', textAlign: 'right' }}>
                {isMaintenanceMode ? '维护模式已启用' : '系统正常运行'}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginBottom: '24px' }}>
            {!isMaintenanceMode ? (
              <button
                onClick={() => setShowEnableForm(true)}
                style={{
                  background: 'linear-gradient(90deg, #dc3545 0%, #c82333 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '25px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                }}
              >
                🛠️ 启用维护模式
              </button>
            ) : (
              <button
                onClick={handleDisableMaintenance}
                style={{
                  background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '25px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                }}
              >
                ✅ 禁用维护模式
              </button>
            )}
          </div>

          {/* 启用维护模式表单 */}
          {showEnableForm && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '25px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>启用维护模式</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontWeight: '500',
                  color: '#fff',
                  fontSize: '14px'
                }}>
                  维护原因 *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="请输入维护原因"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    backdropFilter: 'blur(5px)',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#409eff';
                    e.target.style.boxShadow = '0 0 0 2px rgba(64, 158, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontWeight: '500',
                  color: '#fff',
                  fontSize: '14px'
                }}>
                  维护信息 *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="请输入详细的维护信息"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    backdropFilter: 'blur(5px)',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#409eff';
                    e.target.style.boxShadow = '0 0 0 2px rgba(64, 158, 255, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '15px',
                flexWrap: 'wrap',
                justifyContent: 'flex-start'
              }}>
                <button
                  onClick={handleEnableMaintenance}
                  style={{
                    background: 'linear-gradient(90deg, #dc3545 0%, #c82333 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 10px rgba(220, 53, 69, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(220, 53, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(220, 53, 69, 0.3)';
                  }}
                >
                  ✅ 确认启用
                </button>
                <button
                  onClick={() => setShowEnableForm(false)}
                  style={{
                    background: 'linear-gradient(90deg, #6c757d 0%, #5a6268 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(108, 117, 125, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(108, 117, 125, 0.3)';
                  }}
                >
                  ❌ 取消
                </button>
              </div>
            </div>
          )}

          {/* 维护历史 */}
          <div>
            <div style={{ background: '#fff', border: '1px solid #eef0f4', borderRadius: 16, boxShadow: '0 6px 24px rgba(17,24,39,0.06)', padding: 16, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>📋 维护历史记录</h3>
            </div>
            
            {maintenanceHistory.length === 0 ? (
              <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: 24, background: '#fff', border: '1px solid #eef0f4', borderRadius: 12, boxShadow: '0 2px 12px rgba(17,24,39,0.04)' }}>
                📝 暂无维护历史记录
              </div>
            ) : (
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                paddingRight: '5px'
              }}>
                {maintenanceHistory.slice().reverse().map((record, index) => (
                  <div
                    key={index}
                    style={{
                      background: record.isEnabled 
                        ? 'rgba(255, 193, 7, 0.15)' 
                        : 'rgba(40, 167, 69, 0.15)',
                      border: `1px solid ${record.isEnabled 
                        ? 'rgba(255, 193, 7, 0.3)' 
                        : 'rgba(40, 167, 69, 0.3)'}`,
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      backdropFilter: 'blur(5px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: record.isEnabled ? '#ffc107' : '#28a745',
                        fontSize: '16px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {record.isEnabled ? '🛠️ 维护中' : '✅ 已完成'}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'rgba(255, 255, 255, 0.8)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '12px'
                      }}>
                        {formatDate(record.startTime)}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 8, color: '#111827', fontSize: 14 }}>
                      <strong>原因:</strong> {record.reason}
                    </div>
                    
                    <div style={{ marginBottom: 8, color: '#111827', fontSize: 14 }}>
                      <strong>信息:</strong> {record.message}
                    </div>
                    
                    <div style={{ marginBottom: 8, color: '#111827', fontSize: 14 }}>
                      <strong>维护人员:</strong> {record.enabledBy}
                    </div>
                    
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'center' }}>
                      <span>
                        <strong>持续时间:</strong> {getDuration(record.startTime, record.endTime)}
                      </span>
                      {record.endTime && (
                        <span>
                          <strong>结束时间:</strong> {formatDate(record.endTime)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <ServerStatusPanel />
      )}
    </div>
  );
};

export default MaintenancePanel; 