import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  MessageSquare, 
  MessageCircle,
  FolderTree, 
  Palette, 
  Server, 
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Tooltip } from 'antd';
import { cn } from '@/lib/utils';
import { SiteLogo } from '@/components/SiteLogo';

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const AdminSidebar = ({ collapsed, setCollapsed }: AdminSidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: t('admin.dashboard') || 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: t('admin.users') || 'Users' },
    { to: '/admin/products', icon: Package, label: t('admin.products') || 'Products' },
    { to: '/admin/categories', icon: FolderTree, label: t('admin.categories') || 'Categories' },
    { to: '/admin/comments', icon: MessageSquare, label: t('admin.comments') || 'Comments' },
    { to: '/admin/feedbacks', icon: MessageCircle, label: t('admin.feedbacks') || 'Feedbacks' },
    { to: '/admin/theme', icon: Palette, label: t('admin.theme') || 'Theme' },
    { to: '/admin/system', icon: Server, label: t('admin.system') || 'System' },
  ];

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen sticky top-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo Section - 与 AdminHeader 高度对齐 */}
      <div className={cn("flex items-center gap-3 h-14 border-b border-slate-200 dark:border-slate-800", collapsed ? "justify-center px-0" : "px-6")}>
        <SiteLogo size="md" showText={!collapsed} textClassName="text-lg" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg transition-all duration-200 group relative",
                collapsed ? "px-2 py-3 justify-center" : "px-3 py-2.5",
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <item.icon size={20} className={cn(
                "flex-shrink-0",
                collapsed ? "" : ""
              )} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
          return collapsed ? <Tooltip key={item.to} title={item.label} placement="right">{link}</Tooltip> : link;
        })}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200",
            collapsed ? "px-2 py-3 justify-center" : "px-3 py-2.5"
          )}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          {!collapsed && <span className="text-sm font-medium">{t('common.collapse') || 'Collapse'}</span>}
        </button>

        <button 
          onClick={() => navigate('/')}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200",
            collapsed ? "px-2 py-3 justify-center" : "px-3 py-2.5"
          )}
        >
          <ArrowLeft size={20} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{t('admin.backToFront')}</span>}
        </button>
      </div>
    </aside>
  );
};
