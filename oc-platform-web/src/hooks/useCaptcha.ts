import { useState, useCallback, useRef } from 'react';
import { captchaApi } from '@/utils/api';

interface UseCaptchaReturn {
  token: string | null;
  verify: () => Promise<string>;
  reset: () => void;
  loading: boolean;
  error: string | null;
}

interface TurnstileContainer extends HTMLDivElement {
  resetTurnstile?: () => void;
}

export function useCaptcha(): UseCaptchaReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<TurnstileContainer | null>(null);

  // 重置验证码
  const reset = useCallback(() => {
    setToken(null);
    setError(null);
    
    // 重置 Turnstile widget
    if (containerRef.current?.resetTurnstile) {
      containerRef.current.resetTurnstile();
    }
  }, []);

  // 验证并获取 token
  const verify = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // 如果已经有 token，直接返回
      if (token) {
        return token;
      }

      // 等待用户完成验证
      return new Promise((resolve, reject) => {
        // 设置超时
        const timeout = setTimeout(() => {
          setError('验证超时');
          reject(new Error('验证超时'));
        }, 60000); // 60秒超时

        // 存储回调供 CloudflareTurnstile 组件调用
        (window as Window & { __turnstileVerifyCallback?: (token: string) => void }).__turnstileVerifyCallback = (newToken: string) => {
          clearTimeout(timeout);
          setToken(newToken);
          setLoading(false);
          resolve(newToken);
        };

        (window as Window & { __turnstileErrorCallback?: (error: string) => void }).__turnstileErrorCallback = (errorMsg: string) => {
          clearTimeout(timeout);
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        };
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '验证码验证失败';
      setError(errorMsg);
      setLoading(false);
      throw err;
    }
  }, [token]);

  // 验证 token 到后端
  const verifyToken = useCallback(async (scene: string): Promise<boolean> => {
    if (!token) {
      setError('请先完成验证');
      return false;
    }

    try {
      setLoading(true);
      await captchaApi.verify({ token, scene });
      return true;
    } catch (err) {
      const errorMsg = '验证码验证失败';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 设置容器引用
  const setContainerRef = useCallback((ref: HTMLDivElement | null) => {
    containerRef.current = ref;
  }, []);

  return { 
    token, 
    verify, 
    reset, 
    loading, 
    error,
    verifyToken,
    setContainerRef,
  } as UseCaptchaReturn & {
    verifyToken: (scene: string) => Promise<boolean>;
    setContainerRef: (ref: HTMLDivElement | null) => void;
  };
}
