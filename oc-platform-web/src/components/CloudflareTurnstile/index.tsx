import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';

interface CloudflareTurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  lang?: string;
  className?: string;
  visible?: boolean;
  autoCompact?: boolean;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: (error: string) => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  language?: string;
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
}

function useIsMobile(breakpoint: number = 480): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

const ErrorIcon = () => (
  <svg 
    className="w-4 h-4 mr-1.5 flex-shrink-0" 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path 
      fillRule="evenodd" 
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
      clipRule="evenodd" 
    />
  </svg>
);

const RefreshIcon = () => (
  <svg 
    className="w-3.5 h-3.5 mr-1" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  </svg>
);

export function CloudflareTurnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme: propTheme,
  size = 'normal',
  lang = 'zh-CN',
  className = '',
  visible = true,
  autoCompact = true,
}: CloudflareTurnstileProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  const isMobile = useIsMobile(480);

  const computedSize = useMemo((): 'normal' | 'compact' => {
    if (autoCompact && isMobile) {
      return 'compact';
    }
    return size;
  }, [size, autoCompact, isMobile]);

  const computedTheme = useMemo((): 'light' | 'dark' | 'auto' => {
    if (propTheme) return propTheme;
    
    const mode = currentTheme.appearance.mode;
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    
    if (mode === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }
    
    return 'auto';
  }, [propTheme, currentTheme.appearance.mode]);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (!visible) return;

    if (window.turnstile) {
      setLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    );

    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          setLoaded(true);
          setLoading(false);
          clearInterval(checkLoaded);
        }
      }, 100);

      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => {
      setLoaded(true);
      setLoading(false);
    };

    script.onload = () => {
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          setLoaded(true);
          setLoading(false);
          clearInterval(checkTurnstile);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkTurnstile);
        if (!window.turnstile) {
          const errorMsg = t('captcha.loadingTimeout') || '验证码加载超时，请刷新页面重试';
          setError(errorMsg);
          setLoading(false);
          onErrorRef.current?.(errorMsg);
        }
      }, 10000);
    };

    script.onerror = () => {
      const errorMsg = t('captcha.loadingFailed') || '验证码加载失败，请检查网络连接';
      setError(errorMsg);
      setLoading(false);
      onErrorRef.current?.(errorMsg);
    };

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.warn('Failed to remove turnstile widget:', e);
        }
      }
    };
  }, [visible, t]);

  useEffect(() => {
    if (!loaded || !window.turnstile || !containerRef.current || !visible) {
      return;
    }

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        console.warn('Failed to remove existing widget:', e);
      }
    }

    containerRef.current.innerHTML = '';

    const language = lang === 'zh-CN' ? 'zh-CN' : 'en';

    try {
      const options: TurnstileOptions = {
        sitekey: siteKey,
        callback: (token: string) => {
          setError(null);
          onVerifyRef.current(token);
        },
        theme: computedTheme,
        size: computedSize,
        language,
        retry: 'auto',
        'retry-interval': 1000,
        'refresh-expired': 'auto',
      };

      if (onErrorRef.current) {
        options['error-callback'] = (errorMsg: string) => {
          setError(errorMsg);
          onErrorRef.current?.(errorMsg);
        };
      }

      if (onExpireRef.current) {
        options['expired-callback'] = () => {
          onExpireRef.current?.();
        };
      } else {
        options['expired-callback'] = () => {
          setError(null);
          reset();
        };
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, options);
    } catch (e) {
      const errorMsg = t('captcha.renderFailed') || '验证码渲染失败，请刷新页面';
      console.error('Turnstile render error:', e);
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
    }
  }, [loaded, siteKey, computedTheme, computedSize, lang, visible, t]);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        setError(null);
        window.turnstile.reset(widgetIdRef.current);
      } catch (e) {
        console.warn('Failed to reset Turnstile widget:', e);
      }
    }
  }, []);

  const getResponse = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return undefined;
  }, []);

  const handleRefreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as HTMLDivElement & { resetTurnstile: () => void; getTurnstileResponse: () => string | undefined }).resetTurnstile = reset;
      (containerRef.current as HTMLDivElement & { resetTurnstile: () => void; getTurnstileResponse: () => string | undefined }).getTurnstileResponse = getResponse;
    }
  }, [reset, getResponse]);

  if (!visible) {
    return null;
  }

  return (
    <div className="cloudflare-turnstile-wrapper w-full">
      {loading && !loaded && !error && (
        <div className="flex items-center justify-center py-4 text-slate-500 dark:text-slate-400 text-sm">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
          {t('captcha.loading') || '加载验证码...'}
        </div>
      )}
      
      <div
        ref={containerRef}
        className={`cloudflare-turnstile-container ${className} ${loading && !loaded ? 'hidden' : ''} ${computedSize === 'compact' ? 'flex justify-center' : ''}`}
        style={{ minHeight: computedSize === 'compact' ? '50px' : '65px' }}
      />
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start text-red-600 dark:text-red-400 text-sm font-medium">
            <ErrorIcon />
            <span>{error}</span>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              <RefreshIcon />
              {t('captcha.retry') || '重试'}
            </button>
            
            <span className="text-slate-400 dark:text-slate-500 text-sm">
              {t('captcha.or') || '或'}
            </span>
            
            <button
              onClick={handleRefreshPage}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors duration-200"
            >
              {t('captcha.refreshPage') || '刷新页面'}
            </button>
          </div>
        </div>
      )}
      
      {!error && !loading && (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
            {t('captcha.verifyHint') || '请完成人机验证以继续'}
          </p>
          
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center leading-relaxed">
            {t('captcha.vpnNotice') || '如遇验证困难，请尝试关闭 VPN 或代理后重试'}
          </p>
        </>
      )}
    </div>
  );
}

export const resetTurnstile = (container: HTMLElement) => {
  const containerWithMethods = container as HTMLElement & { resetTurnstile?: () => void };
  if (containerWithMethods.resetTurnstile) {
    containerWithMethods.resetTurnstile();
  }
};

export const getTurnstileResponse = (container: HTMLElement): string | undefined => {
  const containerWithMethods = container as HTMLElement & { getTurnstileResponse?: () => string | undefined };
  if (containerWithMethods.getTurnstileResponse) {
    return containerWithMethods.getTurnstileResponse();
  }
  return undefined;
};
