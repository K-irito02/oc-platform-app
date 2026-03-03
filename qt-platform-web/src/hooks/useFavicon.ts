import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

export const useFavicon = () => {
  const { config } = useAppSelector((state) => state.siteConfig);
  
  useEffect(() => {
    const faviconUrl = config.faviconLogo || config.siteLogo;
    
    let iconLink: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    
    if (faviconUrl) {
      const separator = faviconUrl.includes('?') ? '&' : '?';
      iconLink.href = `${faviconUrl}${separator}t=${Date.now()}`;
    } else {
      iconLink.href = '/vite.svg';
    }
  }, [config.faviconLogo, config.siteLogo]);
};
