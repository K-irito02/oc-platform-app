import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileQuestion, ServerCrash, ShieldX, WifiOff, Home, ArrowLeft, RefreshCw, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FilingInfo } from '@/components/FilingInfo';

type ErrorType = '404' | '500' | '403' | 'network';

interface ErrorPageProps {
  type?: ErrorType;
}

const errorConfig: Record<ErrorType, {
  icon: typeof FileQuestion;
  iconColor: string;
  code: string;
  titleKey: string;
  descriptionKey: string;
  actions: Array<{
    key: string;
    icon: typeof Home;
    variant: 'primary' | 'default';
    onClick: 'home' | 'back' | 'refresh' | 'login';
  }>;
}> = {
  '404': {
    icon: FileQuestion,
    iconColor: 'text-blue-500',
    code: '404',
    titleKey: 'error.404.title',
    descriptionKey: 'error.404.description',
    actions: [
      { key: 'error.404.backHome', icon: Home, variant: 'primary', onClick: 'home' },
      { key: 'error.404.goBack', icon: ArrowLeft, variant: 'default', onClick: 'back' },
    ],
  },
  '500': {
    icon: ServerCrash,
    iconColor: 'text-red-500',
    code: '500',
    titleKey: 'error.500.title',
    descriptionKey: 'error.500.description',
    actions: [
      { key: 'error.500.refresh', icon: RefreshCw, variant: 'primary', onClick: 'refresh' },
      { key: 'error.500.backHome', icon: Home, variant: 'default', onClick: 'home' },
    ],
  },
  '403': {
    icon: ShieldX,
    iconColor: 'text-orange-500',
    code: '403',
    titleKey: 'error.403.title',
    descriptionKey: 'error.403.description',
    actions: [
      { key: 'error.403.login', icon: LogIn, variant: 'primary', onClick: 'login' },
      { key: 'error.403.backHome', icon: Home, variant: 'default', onClick: 'home' },
    ],
  },
  'network': {
    icon: WifiOff,
    iconColor: 'text-yellow-500',
    code: '',
    titleKey: 'error.network.title',
    descriptionKey: 'error.network.description',
    actions: [
      { key: 'error.network.retry', icon: RefreshCw, variant: 'primary', onClick: 'refresh' },
    ],
  },
};

export default function ErrorPage({ type = '404' }: ErrorPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const config = errorConfig[type];
  const IconComponent = config.icon;
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleAction = (action: 'home' | 'back' | 'refresh' | 'login') => {
    switch (action) {
      case 'home':
        navigate('/');
        break;
      case 'back':
        navigate(-1);
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'login':
        navigate('/login');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className={`p-4 rounded-full bg-slate-100 dark:bg-slate-800 ${config.iconColor}`}>
            <IconComponent 
              size={48} 
              strokeWidth={1.5}
              className={prefersReducedMotion ? '' : 'animate-pulse'}
            />
          </div>
        </div>

        {config.code && (
          <h1 className="text-7xl font-bold text-slate-900 dark:text-white mb-2">
            {config.code}
          </h1>
        )}

        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-3">
          {t(config.titleKey)}
        </h2>

        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {t(config.descriptionKey)}
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          {config.actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.key}
                type={action.variant === 'primary' ? 'primary' : 'default'}
                size="large"
                onClick={() => handleAction(action.onClick)}
                className={`inline-flex items-center gap-2 cursor-pointer transition-colors duration-200 ${
                  action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
              >
                <ActionIcon size={18} />
                {t(action.key)}
              </Button>
            );
          })}
        </div>
      </div>
      <FilingInfo />
    </div>
  );
}

export function Error404() {
  return <ErrorPage type="404" />;
}

export function Error500() {
  return <ErrorPage type="500" />;
}

export function Error403() {
  return <ErrorPage type="403" />;
}

export function ErrorNetwork() {
  return <ErrorPage type="network" />;
}
