import { useEffect, useRef, useState, useCallback } from 'react';

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
  theme = 'auto',
  size = 'normal',
  lang = 'zh-CN',
  className = '',
  visible = true,
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          onError?.('Turnstile SDK 加载超时');
        }
      }, 10000);
    };

    script.onerror = () => {
      setError('Turnstile SDK 加载失败');
      onError?.('Turnstile SDK 加载失败');
    };

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.warn('Failed to remove Turnstile widget:', e);
        }
      }
    };
  }, [onError, visible]);

  const renderWidget = useCallback(() => {
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
          onVerify(token);
        },
        theme,
        size,
        language,
        retry: 'auto',
        'retry-interval': 1000,
        'refresh-expired': 'auto',
      };

      if (onError) {
        options['error-callback'] = (errorMsg: string) => {
          setError(errorMsg);
          onError(errorMsg);
        };
      }

      if (onExpire) {
        options['expired-callback'] = () => {
          onExpire();
        };
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, options);
    } catch (e) {
      const errorMsg = 'Turnstile 渲染失败';
      console.error('Turnstile render error:', e);
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [loaded, siteKey, onVerify, onError, onExpire, theme, size, lang, visible]);

  useEffect(() => {
    if (loaded && visible) {
      renderWidget();
    }
  }, [loaded, renderWidget, visible]);

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
      (containerRef.current as any).resetTurnstile = reset;
      (containerRef.current as any).getTurnstileResponse = getResponse;
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
  if ((container as any).resetTurnstile) {
    (container as any).resetTurnstile();
  }
};

export const getTurnstileResponse = (container: HTMLElement): string | undefined => {
  if ((container as any).getTurnstileResponse) {
    return (container as any).getTurnstileResponse();
  }
  return undefined;
};
