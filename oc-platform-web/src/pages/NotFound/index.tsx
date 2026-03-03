import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Result
        status="404"
        title="404"
        subTitle={t('common.pageNotFound') || 'Sorry, the page you visited does not exist.'}
        extra={
          <Button type="primary" onClick={() => navigate('/')} className="bg-blue-600">
            {t('common.backToHome') || 'Back Home'}
          </Button>
        }
      />
    </div>
  );
}
