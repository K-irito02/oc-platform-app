import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

export default function AdminTheme() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t('admin.theme') || 'Theme Settings'}</h2>
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">
          Global theme settings are coming soon. Use the toggle in the navbar to switch between Light and Dark modes.
        </p>
      </Card>
    </div>
  );
}
