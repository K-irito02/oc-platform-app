import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Package, 
  LayoutDashboard, 
  User, 
  LogOut, 
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Tooltip } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const isAdmin = user?.roles?.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));

  const navItems = [
    { to: '/', icon: Home, label: t('common.home') || '首页' },
    { to: '/products', icon: Package, label: t('common.products') || '产品中心' },
    { to: '/profile', icon: User, label: t('common.profile') || '个人中心' },
  ];

  if (isAdmin) {
    navItems.splice(2, 0, { to: '/admin', icon: LayoutDashboard, label: t('common.admin') || '管理后台' });
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen sticky top-0 z-40 p-4 transition-all duration-300",
      collapsed ? "w-20" : "w-72"
    )}>
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden bg-white/40 backdrop-blur-xl border-white/20 shadow-2xl">
        
        {/* Logo Section */}
        <div className={cn("flex items-center gap-3 py-8 border-b border-white/10", collapsed ? "px-4 justify-center" : "px-6")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 flex-shrink-0">
            Qt
          </div>
          {!collapsed && <span className="font-bold text-xl text-slate-800 tracking-tight">Platform</span>}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 py-6 space-y-2 overflow-y-auto custom-scrollbar", collapsed ? "px-2" : "px-4")}>
          {navItems.map((item) => {
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  collapsed ? "px-3 py-3.5 justify-center" : "px-4 py-3.5",
                  isActive 
                    ? "bg-white/60 text-blue-600 font-semibold shadow-sm" 
                    : "text-slate-600 hover:bg-white/30 hover:text-slate-900"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={cn(
                      "transition-transform duration-300 flex-shrink-0",
                      isActive ? "scale-110" : "group-hover:scale-105"
                    )} />
                    {!collapsed && <span className="z-10">{item.label}</span>}
                    
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                    )}
                  </>
                )}
              </NavLink>
            );
            return collapsed ? <Tooltip key={item.to} title={item.label} placement="right">{link}</Tooltip> : link;
          })}
        </nav>

        {/* Footer Actions */}
        <div className={cn("mt-auto border-t border-white/10 space-y-2 bg-white/10", collapsed ? "p-2" : "p-4")}>
          {/* Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-slate-500 hover:bg-white/30 hover:text-slate-700 transition-all duration-300",
              collapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
            )}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            {!collapsed && <span className="font-medium text-sm">{t('common.collapse') || '收起'}</span>}
          </button>

          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group",
              collapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
            )}
          >
            <LogOut size={20} className="text-slate-500 group-hover:text-red-500 transition-colors flex-shrink-0" />
            {!collapsed && <span className="font-medium">{t('common.logout') || '退出登录'}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
