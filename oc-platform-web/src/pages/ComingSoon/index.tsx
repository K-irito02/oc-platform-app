import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';

export default function ComingSoon() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Result
        icon={<Construction size={80} className="text-blue-500" />}
        title={<span className="text-2xl font-bold text-slate-900 dark:text-white">{t('comingSoon.title')}</span>}
        subTitle={<span className="text-slate-500 dark:text-slate-400">{t('comingSoon.subtitle')}</span>}
        extra={
          <Button type="primary" size="large" onClick={() => navigate('/')} className="bg-blue-600">
            {t('common.backToHome')}
          </Button>
        }
      />
    </div>
  );
}
