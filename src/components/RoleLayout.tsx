import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // 屏幕变大时自动关闭移动端导航
      if (!mobile) {
        setShowMobileNav(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleNavClick = (item: RoleNavItem) => {
    if (item.onClick) item.onClick();
    if (item.to) {
      const query = item.query ? `?${new URLSearchParams(Object.entries(item.query).map(([k,v])=>[k, String(v)])).toString()}` : '';
      navigate(`${item.to}${query}`);
    }
    // 移动端点击导航后自动关闭菜单
    if (isMobile) {
      setShowMobileNav(false);
    }
  };

  // 渲染导航项
  const renderNavItems = (items: RoleNavItem[], showIcons: boolean = true) => (
    <>
      {items.filter(i => (i.section ?? 'main') === 'main').map(item => (
        <button key={item.key}
          onClick={() => handleNavClick(item)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 10,
            padding: isMobile ? '8px 12px' : '10px 12px',
            borderRadius: isMobile ? 8 : 12,
            border: '1px solid',
            borderColor: item.active ? '#e5e7eb' : 'transparent',
            background: item.active ? '#f5f7fb' : 'transparent',
            cursor: 'pointer',
            color: '#111827',
            marginBottom: isMobile ? 4 : 6,
            fontSize: isMobile ? 14 : 'inherit'
          }}>
          {showIcons && <span style={{ width: 18, textAlign: 'center' }}>{item.icon ?? '•'}</span>}
          <span style={{ flex: 1, textAlign: 'left', fontSize: isMobile ? 13 : 14 }}>{item.label}</span>
          {item.badgeText && (
            <span style={{
              fontSize: isMobile ? 10 : 12,
              background: '#eef2ff',
              color: '#4f46e5',
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid #e0e7ff',
            }}>{item.badgeText}</span>
          )}
        </button>
      ))}

      {navItems.some(i => i.section === 'other') && (
        <div style={{ marginTop: isMobile ? 8 : 10, paddingTop: isMobile ? 8 : 10, borderTop: '1px solid #f1f5f9' }}>
          {navItems.filter(i => i.section === 'other').map(item => (
            <button key={item.key}
              onClick={() => handleNavClick(item)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 8 : 10,
                padding: isMobile ? '8px 12px' : '10px 12px',
                borderRadius: isMobile ? 8 : 12,
                border: '1px solid',
                borderColor: item.active ? '#e5e7eb' : 'transparent',
                background: item.active ? '#f5f7fb' : 'transparent',
                cursor: 'pointer',
                color: '#111827',
                marginBottom: isMobile ? 4 : 6,
                fontSize: isMobile ? 14 : 'inherit'
              }}>
              {showIcons && <span style={{ width: 18, textAlign: 'center' }}>{item.icon ?? '•'}</span>}
              <span style={{ flex: 1, textAlign: 'left', fontSize: isMobile ? 13 : 14 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (isMobile) {
    // 移动端布局
    return (
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        color: '#111827',
        boxSizing: 'border-box',
        paddingBottom: '90px'
      }}>
        {/* 移动端顶部导航 */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid #eef0f4',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(17, 24, 39, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#6366f1',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 12
            }}>XL</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {headerActions}
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              style={{
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              {showMobileNav ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* 移动端侧滑菜单 */}
        {showMobileNav && (
          <>
            {/* 背景遮罩 */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 200
              }}
              onClick={() => setShowMobileNav(false)}
            />
            
            {/* 侧滑菜单 */}
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              width: '280px',
              maxWidth: '80vw',
              background: '#fff',
              zIndex: 300,
              padding: 16,
              overflowY: 'auto',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0 16px 0',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>导航菜单</div>
                <button
                  onClick={() => setShowMobileNav(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 18,
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ flex: 1 }}>
                {renderNavItems(navItems, true)}
              </div>

              {/* 用户信息 */}
              <div style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #eef2f7',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#e5e7eb',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  color: '#374151',
                  fontSize: 12
                }}>{(user?.name || user?.username || 'U').toString().slice(0,1).toUpperCase()}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{user?.name || user?.username}</span>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>
                    {user?.role === 'admin' ? '系统管理员' : user?.role === 'maintenance' ? '维护人员' : '普通用户'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 移动端主体内容 */}
        <div style={{ padding: '16px' }}>
          {children}
        </div>
      </div>
    );
  }

  // 桌面端布局（保持原样）
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
        {/* 桌面端侧边栏 */}
        <div style={{
          background: '#fff',
          border: '1px solid #eef0f4',
          borderRadius: 20,
          boxShadow: '0 8px 26px rgba(17, 24, 39, 0.06)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 24,
          alignSelf: 'start',
          minHeight: 'calc(100vh - 72px)',
          maxHeight: 'calc(100vh - 48px)'
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
            <div style={{ fontWeight: 700, fontSize: 16 }}>兴站智训通</div>
          </div>

          {/* 主导航 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderNavItems(navItems, true)}
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

        {/* 桌面端主体区域 */}
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


