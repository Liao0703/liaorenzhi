import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface RoleNavItem {
  key: string;
  label: string;
  icon?: string; // 使用 Emoji 简化图标
  active?: boolean;
  to?: string;
  query?: Record<string, string | number | boolean>;
  onClick?: () => void;
  section?: 'main' | 'other';
  badgeText?: string;
}

interface RoleLayoutProps {
  user: any;
  title: string;
  navItems: RoleNavItem[];
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

// 统一的卡片容器样式（用于内部页面内容）
export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }>
  = ({ style, children }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #eef0f4',
    borderRadius: 16,
    boxShadow: '0 6px 24px rgba(17, 24, 39, 0.06)',
    padding: 20,
    ...style,
  }}>
    {children}
  </div>
);

const RoleLayout: React.FC<RoleLayoutProps> = ({ user, title, navItems, headerActions, children }) => {
  const navigate = useNavigate();

  const handleNavClick = (item: RoleNavItem) => {
    if (item.onClick) item.onClick();
    if (item.to) {
      const query = item.query ? `?${new URLSearchParams(Object.entries(item.query).map(([k,v])=>[k, String(v)])).toString()}` : '';
      navigate(`${item.to}${query}`);
    }
  };

  return (
    <div style={{
      position: 'relative',
      zIndex: 10,
      padding: '24px 24px 90px',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      color: '#111827',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px minmax(0, 980px)',
        gap: 20,
        width: 'min(1280px, 96vw)',
      }}>
        {/* 侧边栏 */}
        <div style={{
          background: '#fff',
          border: '1px solid #eef0f4',
          borderRadius: 20,
          boxShadow: '0 8px 26px rgba(17, 24, 39, 0.06)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 160px)',
          position: 'sticky',
          top: 24,
        }}>
          {/* 品牌 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 16px 8px' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#6366f1',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
            }}>XL</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>学习系统</div>
          </div>

          {/* 主导航 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {(navItems.filter(i => (i.section ?? 'main') === 'main')).map(item => (
              <button key={item.key}
                onClick={() => handleNavClick(item)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid',
                  borderColor: item.active ? '#e5e7eb' : 'transparent',
                  background: item.active ? '#f5f7fb' : 'transparent',
                  cursor: 'pointer',
                  color: '#111827',
                  marginBottom: 6,
                }}>
                <span style={{ width: 18, textAlign: 'center' }}>{item.icon ?? '•'}</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 14 }}>{item.label}</span>
                {item.badgeText && (
                  <span style={{
                    fontSize: 12,
                    background: '#eef2ff',
                    color: '#4f46e5',
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid #e0e7ff',
                  }}>{item.badgeText}</span>
                )}
              </button>
            ))}

            {/* 其他分组 */}
            {navItems.some(i => i.section === 'other') && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                {(navItems.filter(i => i.section === 'other')).map(item => (
                  <button key={item.key}
                    onClick={() => handleNavClick(item)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: item.active ? '#e5e7eb' : 'transparent',
                      background: item.active ? '#f5f7fb' : 'transparent',
                      cursor: 'pointer',
                      color: '#111827',
                      marginBottom: 6,
                    }}>
                    <span style={{ width: 18, textAlign: 'center' }}>{item.icon ?? '•'}</span>
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 14 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 用户信息 */}
          <div style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            background: '#f8fafc',
            border: '1px solid #eef2f7',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#e5e7eb',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              color: '#374151'
            }}>{(user?.name || user?.username || 'U').toString().slice(0,1).toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || user?.username}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {user?.role === 'admin' ? '系统管理员' : user?.role === 'maintenance' ? '维护人员' : '普通用户'}
              </span>
            </div>
          </div>
        </div>

        {/* 主体区域 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 顶部栏 */}
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {headerActions}
              </div>
            </div>
          </Card>

          {/* 内容卡片容器 */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleLayout;


