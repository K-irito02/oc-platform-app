import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';

interface SiteLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-lg',
  lg: 'w-12 h-12 text-2xl',
  xl: 'w-16 h-16 text-3xl',
};

export const SiteLogo = ({ 
  size = 'md', 
  showText = false, 
  className = '',
  textClassName = ''
}: SiteLogoProps) => {
  const { i18n } = useTranslation();
  const { config } = useAppSelector((state) => state.siteConfig);
  
  const siteName = i18n.language === 'zh-CN' ? config.siteName : config.siteNameEn;
  const displayName = siteName || '桐人创研';
  const firstLetter = displayName[0]?.toUpperCase() || 'K';
  
  return (
    <div className={`flex items-center ${className}`}>
      {config.siteLogo ? (
        <img 
          src={config.siteLogo} 
          alt={displayName}
          className={`${sizeMap[size].split(' ').slice(0, 2).join(' ')} rounded-lg object-cover`}
        />
      ) : (
        <div className={`${sizeMap[size]} bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold`}>
          {firstLetter}
        </div>
      )}
      {showText && (
        <span className={`ml-2 font-bold text-slate-900 dark:text-white ${textClassName}`}>
          {displayName}
        </span>
      )}
    </div>
  );
};
