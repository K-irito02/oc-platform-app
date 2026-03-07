import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  const currentTheme = useAppSelector((state) => state.theme.currentTheme);

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
    };

    script.onload = () => {
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          setLoaded(true);
          clearInterval(checkTurnstile);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkTurnstile);
        if (!window.turnstile) {
          setError('Turnstile SDK 加载超时');
          onErrorRef.current?.('Turnstile SDK 加载超时');
        }
      }, 10000);
    };

    script.onerror = () => {
      setError('Turnstile SDK 加载失败');
      onErrorRef.current?.('Turnstile SDK 加载失败');
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
  }, [visible]);

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
        size,
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
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, options);
    } catch (e) {
      const errorMsg = 'Turnstile 渲染失败';
      console.error('Turnstile render error:', e);
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
    }
  }, [loaded, siteKey, computedTheme, size, lang, visible]);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      try {
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
    <div className="cloudflare-turnstile-wrapper">
      <div
        ref={containerRef}
        className={`cloudflare-turnstile-container ${className}`}
        style={{ minHeight: size === 'compact' ? '50px' : '65px' }}
      />
      {error && (
        <div className="cloudflare-turnstile-error" style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </div>
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
