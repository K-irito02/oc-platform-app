import { useEffect, useState } from 'react';
import { Button, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { Wrench, Clock, Mail, RefreshCw } from 'lucide-react';
import request from '@/utils/request';

interface MaintenanceStatus {
  enabled: boolean;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  estimatedTime: string | null;
}

export default function Maintenance() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const isEnglish = i18n.language === 'en-US';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  useEffect(() => {
    if (status?.estimatedTime) {
      const updateCountdown = () => {
        const targetTime = new Date(status.estimatedTime!).getTime();
        const now = Date.now();
        const diff = targetTime - now;

        if (diff <= 0) {
          setCountdown(null);
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [status?.estimatedTime]);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await request.get('/api/v1/public/system/maintenance');
      setStatus(response.data.data);
    } catch {
      setStatus({
        enabled: true,
        title: '系统维护中',
        titleEn: 'Under Maintenance',
        message: '系统正在进行升级维护，请稍后再试。',
        messageEn: 'The system is under maintenance. Please try again later.',
        estimatedTime: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spin size="large" />
      </div>
    );
  }

  const title = isEnglish ? status?.titleEn : status?.title;
  const message = isEnglish ? status?.messageEn : status?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500">
            <Wrench 
              size={48} 
              strokeWidth={1.5}
              className={prefersReducedMotion ? '' : 'animate-pulse'}
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          {title || t('maintenance.title')}
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {message || t('maintenance.description')}
        </p>

        {status?.estimatedTime && (
          <div className="mb-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 mb-2">
              <Clock size={18} />
              <span>{t('maintenance.estimatedTime')}</span>
            </div>
            {countdown ? (
              <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                {countdown}
              </div>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(status.estimatedTime).toLocaleString(i18n.language === 'en-US' ? 'en-US' : 'zh-CN')}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Button
            type="primary"
            size="large"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 cursor-pointer bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
          >
            <RefreshCw size={18} />
            {t('maintenance.checkAgain')}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500">
          <Mail size={16} />
          <span>{t('maintenance.contact')}</span>
        </div>
      </div>
    </div>
  );
}
