import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, Sun, Moon, Monitor, User, LogOut, Settings } from 'lucide-react';
import { Button, Dropdown, Avatar } from 'antd';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { setSystemConfig } from '@/store/slices/themeSlice';
import { SiteLogo } from '@/components/SiteLogo';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentTheme } = useAppSelector((state) => state.theme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleTheme = (mode: 'light' | 'dark' | 'system') => {
    dispatch(setSystemConfig({
      appearance: {
        ...currentTheme.appearance,
        mode,
      }
    }));
  };

  const themeMenu = {
    items: [
      { key: 'light', label: t('theme.light') || 'Light', icon: <Sun size={16} />, onClick: () => toggleTheme('light') },
      { key: 'dark', label: t('theme.dark') || 'Dark', icon: <Moon size={16} />, onClick: () => toggleTheme('dark') },
      { key: 'system', label: t('theme.system') || 'System', icon: <Monitor size={16} />, onClick: () => toggleTheme('system') },
    ]
  };

  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN' || role === 'SUPER_ADMIN'
  );

  const userMenu = {
    items: [
      { key: 'profile', label: t('common.profile') || 'Profile', icon: <User size={16} />, onClick: () => navigate('/profile') },
      ...(isAdmin ? [
        { key: 'admin', label: t('common.admin') || 'Admin', icon: <Settings size={16} />, onClick: () => navigate('/admin') },
      ] : []),
      { type: 'divider' as const },
      { key: 'logout', label: t('common.logout') || 'Logout', icon: <LogOut size={16} />, danger: true, onClick: handleLogout },
    ]
  };

  const navLinks = [
    { name: t('nav.products') || 'Products', path: '/products' },
    { name: t('nav.developers') || 'Developers', path: '/developers' },
    { name: t('nav.about') || 'About', path: '/about' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <SiteLogo size="md" showText textClassName="text-xl" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button type="text" shape="circle" icon={<Globe size={20} />} onClick={toggleLanguage} />
            
            <Dropdown menu={themeMenu} placement="bottomRight" arrow>
              <Button type="text" shape="circle" icon={
                currentTheme.appearance.mode === 'dark' ? <Moon size={20} /> : 
                currentTheme.appearance.mode === 'system' ? <Monitor size={20} /> : <Sun size={20} />
              } />
            </Dropdown>

            {isAuthenticated ? (
              <Dropdown menu={userMenu} placement="bottomRight" arrow>
                <div className="flex items-center space-x-2 cursor-pointer ml-2">
                  <Avatar src={user?.avatarUrl} style={{ backgroundColor: '#2563eb' }}>{user?.username?.[0]?.toUpperCase()}</Avatar>
                </div>
              </Dropdown>
            ) : (
              <div className="flex items-center space-x-2">
                <Button type="text" onClick={() => navigate('/login')}>
                  {t('common.login') || 'Log in'}
                </Button>
                <Button type="primary" onClick={() => navigate('/register')} className="bg-blue-600">
                  {t('common.register') || 'Sign up'}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-around px-5">
              <Button type="text" icon={<Globe size={20} />} onClick={toggleLanguage}>
                {i18n.language === 'zh-CN' ? '中文' : 'EN'}
              </Button>
              <Dropdown menu={themeMenu} trigger={['click']}>
                <Button type="text" icon={<Sun size={20} />}>{t('theme.title') || 'Theme'}</Button>
              </Dropdown>
            </div>
            {!isAuthenticated && (
              <div className="mt-4 px-5 space-y-2">
                <Button block onClick={() => navigate('/login')}>{t('common.login') || 'Log in'}</Button>
                <Button block type="primary" onClick={() => navigate('/register')}>{t('common.register') || 'Sign up'}</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
