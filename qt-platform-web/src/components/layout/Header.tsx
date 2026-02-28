import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Search, Globe, Menu } from 'lucide-react';
import { Dropdown, Avatar, Badge } from 'antd';
import type { MenuProps } from 'antd';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { GlassButton } from '@/components/ui/GlassButton';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN' || role === 'SUPER_ADMIN'
  );

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: t('common.profile') || '个人中心', onClick: () => navigate('/profile') },
    ...(isAdmin ? [
      { key: 'admin', label: t('common.admin') || '管理后台', onClick: () => navigate('/admin') },
    ] : []),
    { type: 'divider' },
    { key: 'logout', label: t('common.logout') || '退出登录', onClick: handleLogout, danger: true },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return t('common.home') || '首页';
    if (path.startsWith('/products')) return t('common.products') || '产品中心';
    if (path.startsWith('/admin')) return t('common.admin') || '管理后台';
    if (path.startsWith('/profile')) return t('common.profile') || '个人中心';
    return '';
  };

  return (
    <>
      <header className="sticky top-0 z-30 px-8 py-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-3 flex items-center justify-between shadow-sm">
          
          {/* Left: Mobile Menu & Title */}
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-lg hover:bg-white/50 text-slate-600">
              <Menu size={20} />
            </button>
            
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Search (Visual Only for now) */}
            <div className="hidden md:flex items-center px-3 py-1.5 rounded-xl bg-white/40 border border-white/30 focus-within:ring-2 focus-within:ring-primary/50 transition-all w-64">
              <Search size={16} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
              />
            </div>

            <GlassButton variant="ghost" size="sm" onClick={toggleLanguage} className="hidden sm:flex">
              <Globe size={16} className="mr-2" />
              {i18n.language === 'zh-CN' ? 'EN' : '中文'}
            </GlassButton>

            <GlassButton variant="ghost" size="sm" className="relative">
              <Badge dot offset={[-2, 2]}>
                <Bell size={20} className="text-slate-600" />
              </Badge>
            </GlassButton>

            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight" 
              trigger={['click']}
              overlayClassName="glass-dropdown"
            >
              <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-white/30 p-1.5 rounded-xl transition-colors">
                <Avatar src={user?.avatarUrl} className="bg-gradient-to-tr from-blue-400 to-indigo-500 border-2 border-white shadow-sm" />
                <div className="hidden md:block text-sm">
                  <p className="font-semibold text-slate-800 leading-none">{user?.nickname || user?.username}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{user?.roles?.[0]?.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>
    </>
  );
};
