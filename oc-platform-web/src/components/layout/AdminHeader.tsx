import { useTranslation } from 'react-i18next';
import { Menu, Globe, Sun, Moon, Monitor, Bell, Search, User, LogOut } from 'lucide-react';
import { Button, Dropdown, Avatar, Input, Badge } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSystemConfig } from '@/store/slices/themeSlice';
import { logout } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onMenuClick?: () => void;
}

export const AdminHeader = ({ collapsed, setCollapsed, onMenuClick }: AdminHeaderProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentTheme } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);

  const toggleTheme = (mode: 'light' | 'dark' | 'system') => {
    dispatch(setSystemConfig({
      appearance: { ...currentTheme.appearance, mode }
    }));
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const themeMenu = {
    items: [
      { key: 'light', label: t('theme.light') || 'Light', icon: <Sun size={16} />, onClick: () => toggleTheme('light') },
      { key: 'dark', label: t('theme.dark') || 'Dark', icon: <Moon size={16} />, onClick: () => toggleTheme('dark') },
      { key: 'system', label: t('theme.system') || 'System', icon: <Monitor size={16} />, onClick: () => toggleTheme('system') },
    ]
  };

  const userMenu = {
    items: [
      { key: 'profile', label: t('common.profile') || 'Profile', icon: <User size={16} />, onClick: () => navigate('/profile') },
      { type: 'divider' as const },
      { key: 'logout', label: t('common.logout') || 'Logout', icon: <LogOut size={16} />, danger: true, onClick: () => { dispatch(logout()); navigate('/login'); } },
    ]
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onMenuClick ? onMenuClick() : setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 md:block hidden"
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <Menu size={20} />
        </button>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <Search size={16} className="absolute left-3 text-slate-400 z-10" />
          <Input 
            placeholder={t('admin.searchProduct')}
            className="w-72 pl-9 h-9 bg-slate-100 dark:bg-slate-800 border-none rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="text" shape="circle" icon={<Globe size={18} />} onClick={toggleLanguage} className="text-slate-500 dark:text-slate-400" />
        
        <Dropdown menu={themeMenu} placement="bottomRight" arrow>
          <Button type="text" shape="circle" icon={
            currentTheme.appearance.mode === 'dark' ? <Moon size={18} /> : 
            currentTheme.appearance.mode === 'system' ? <Monitor size={18} /> : <Sun size={18} />
          } className="text-slate-500 dark:text-slate-400" />
        </Dropdown>

        <Button type="text" shape="circle" icon={
          <Badge dot>
            <Bell size={18} />
          </Badge>
        } className="text-slate-500 dark:text-slate-400 mr-2" />

        <Dropdown menu={userMenu} placement="bottomRight" arrow>
          <div className="flex items-center gap-3 cursor-pointer pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900 dark:text-white">{user?.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Admin</div>
            </div>
            <Avatar src={user?.avatarUrl} className="bg-blue-600">{user?.username?.[0]?.toUpperCase()}</Avatar>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};
