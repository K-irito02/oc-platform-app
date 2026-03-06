import { useState, useEffect, useCallback } from 'react';
import { captchaApi } from '@/utils/api';

interface CaptchaConfig {
  enabled: boolean;
  siteKey: string | null;
}

interface UseCaptchaConfigReturn {
  config: CaptchaConfig;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

let cachedConfig: CaptchaConfig | null = null;

export function useCaptchaConfig(): UseCaptchaConfigReturn {
  const [config, setConfig] = useState<CaptchaConfig>({
    enabled: false,
    siteKey: null,
  });
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await captchaApi.getConfig();
      const data = response.data;
      const newConfig: CaptchaConfig = {
        enabled: data.enabled === true,
        siteKey: data.siteKey || null,
      };
      cachedConfig = newConfig;
      setConfig(newConfig);
    } catch (err) {
      console.error('Failed to fetch captcha config:', err);
      setError('Failed to load captcha configuration');
      setConfig({ enabled: false, siteKey: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
}

export function clearCaptchaConfigCache() {
  cachedConfig = null;
}
