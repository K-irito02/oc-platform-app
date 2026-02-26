import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, Monitor } from 'lucide-react';
import { Button, Dropdown } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSystemConfig } from '@/store/slices/themeSlice';

export const AuthPageToolbar = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { currentTheme } = useAppSelector((state) => state.theme);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const toggleTheme = (mode: 'light' | 'dark' | 'system') => {
    dispatch(setSystemConfig({
      appearance: { ...currentTheme.appearance, mode },
    }));
  };

  const themeMenu = {
    items: [
      { key: 'light', label: t('theme.light') || 'Light', icon: <Sun size={16} />, onClick: () => toggleTheme('light') },
      { key: 'dark', label: t('theme.dark') || 'Dark', icon: <Moon size={16} />, onClick: () => toggleTheme('dark') },
      { key: 'system', label: t('theme.system') || 'System', icon: <Monitor size={16} />, onClick: () => toggleTheme('system') },
    ],
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Button
        type="text"
        shape="circle"
        icon={<Globe size={20} />}
        onClick={toggleLanguage}
        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
        title={i18n.language === 'zh-CN' ? 'English' : '中文'}
      />
      <Dropdown menu={themeMenu} placement="bottomRight" arrow>
        <Button
          type="text"
          shape="circle"
          icon={
            currentTheme.appearance.mode === 'dark' ? <Moon size={20} /> :
            currentTheme.appearance.mode === 'system' ? <Monitor size={20} /> : <Sun size={20} />
          }
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
        />
      </Dropdown>
    </div>
  );
};
