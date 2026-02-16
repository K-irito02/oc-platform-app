import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  MessageSquare, 
  FolderTree, 
  Palette, 
  Server, 
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Tooltip } from 'antd';
import { cn } from '@/lib/utils';

export const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin_sidebar_collapsed') === 'true');

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: t('admin.dashboard') || '仪表盘', end: true },
    { to: '/admin/users', icon: Users, label: t('admin.users') || '用户管理' },
    { to: '/admin/products', icon: Package, label: t('admin.products') || '产品管理' },
    { to: '/admin/categories', icon: FolderTree, label: t('admin.categories') || '分类管理' },
    { to: '/admin/comments', icon: MessageSquare, label: t('admin.comments') || '评论管理' },
    { to: '/admin/theme', icon: Palette, label: t('admin.theme') || '主题设置' },
    { to: '/admin/system', icon: Server, label: t('admin.system') || '系统设置' },
  ];

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('admin_sidebar_collapsed', String(next));
  };

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen sticky top-0 z-40 p-4 transition-all duration-300",
      collapsed ? "w-20" : "w-72"
    )}>
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-2xl text-white">
        
        {/* Logo Section */}
        <div className={cn("flex items-center gap-3 py-8 border-b border-white/10", collapsed ? "px-4 justify-center" : "px-6")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-rose-500/30 flex-shrink-0">
            Qt
          </div>
          {!collapsed && <span className="font-bold text-xl text-white tracking-tight">Admin</span>}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 py-6 space-y-2 overflow-y-auto custom-scrollbar", collapsed ? "px-2" : "px-4")}>
          {navItems.map((item) => {
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  collapsed ? "px-3 py-3.5 justify-center" : "px-4 py-3.5",
                  isActive 
                    ? "bg-white/10 text-white font-semibold shadow-sm" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={cn(
                      "transition-transform duration-300 flex-shrink-0",
                      isActive ? "scale-110 text-rose-400" : "group-hover:scale-105"
                    )} />
                    {!collapsed && <span className="z-10">{item.label}</span>}
                    
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-rose-500 rounded-l-full shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
                    )}
                  </>
                )}
              </NavLink>
            );
            return collapsed ? <Tooltip key={item.to} title={item.label} placement="right">{link}</Tooltip> : link;
          })}
        </nav>

        {/* Footer Actions */}
        <div className={cn("mt-auto border-t border-white/10 space-y-2 bg-black/20", collapsed ? "p-2" : "p-4")}>
          {/* Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-slate-500 hover:bg-white/10 hover:text-white transition-all duration-300",
              collapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
            )}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            {!collapsed && <span className="font-medium text-sm">{t('common.collapse') || '收起'}</span>}
          </button>

          <button 
            onClick={() => navigate('/')}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300 group",
              collapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
            )}
          >
            <ArrowLeft size={20} className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
            {!collapsed && <span className="font-medium">{t('admin.backToFront')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
