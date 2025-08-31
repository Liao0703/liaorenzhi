import React from 'react';
import RoleLayout from './components/RoleLayout';
import type { RoleNavItem } from './components/RoleLayout';
import Settings from './Settings';

interface SettingsPageProps {
  user: any;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const buildNav = (): RoleNavItem[] => {
    if (user?.role === 'admin') {
      return [
        { key: 'home', label: '概览', icon: '🏠', to: '/dashboard' },
        { key: 'users', label: '用户学习总览', icon: '👥', to: '/admin', query: { tab: 'users' } },
        { key: 'article-records', label: '学习记录查询', icon: '📋', to: '/admin', query: { tab: 'article-records' } },
        { key: 'articles', label: '文章管理', icon: '📄', to: '/admin', query: { tab: 'articles' } },
        { key: 'stats', label: '统计分析', icon: '📊', to: '/admin', query: { tab: 'statistics' } },
        { key: 'photos', label: '照片管理', icon: '📷', to: '/admin', query: { tab: 'photos' } },
        { key: 'settings', label: '个人设置', icon: '⚙️', section: 'other', active: true },
      ];
    }
    if (user?.role === 'maintenance') {
      return [
        { key: 'home', label: '概览', icon: '🏠', to: '/dashboard' },
        { key: 'maintenance', label: '维护模式', icon: '🛠️', to: '/maintenance-admin', query: { tab: 'maintenance' } },
        { key: 'users', label: '用户账号管理', icon: '👥', to: '/maintenance-admin', query: { tab: 'users' } },
        { key: 'settings', label: '个人设置', icon: '⚙️', section: 'other', active: true },
      ];
    }
    return [
      { key: 'home', label: '概览', icon: '🏠', to: '/dashboard' },
      { key: 'learn', label: '学习中心', icon: '📚', to: '/articles', badgeText: '新' },
      { key: 'settings', label: '个人设置', icon: '⚙️', section: 'other', active: true },
    ];
  };

  return (
    <RoleLayout
      user={user}
      title={user?.role === 'admin' ? '系统管理员 - 个人设置' : user?.role === 'maintenance' ? '维护人员 - 个人设置' : '个人设置'}
      navItems={buildNav()}
    >
      <Settings user={user} />
    </RoleLayout>
  );
};

export default SettingsPage;


