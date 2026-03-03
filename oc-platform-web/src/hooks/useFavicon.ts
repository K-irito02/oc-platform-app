import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

const generateDefaultFavicon = (firstLetter: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#2563eb"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${firstLetter}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const useFavicon = () => {
  const { config } = useAppSelector((state) => state.siteConfig);
  
  useEffect(() => {
    const siteName = config.siteName || 'KirLab';
    const firstLetter = siteName.charAt(0).toUpperCase();
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
      iconLink.href = generateDefaultFavicon(firstLetter);
    }
  }, [config.faviconLogo, config.siteLogo, config.siteName]);
};
