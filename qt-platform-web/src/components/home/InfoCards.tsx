import { useTranslation } from 'react-i18next';
import { CircleDollarSign, Info } from 'lucide-react';

export default function InfoCards() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      {/* 免费声明 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-100 dark:border-green-800/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t('disclaimer.title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
              {t('disclaimer.content')}
            </p>
            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
              {t('disclaimer.thirdParty')}
            </span>
          </div>
        </div>
      </div>

      {/* 更新说明 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-100 dark:border-purple-800/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t('update.title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
              {t('update.content')}
            </p>
            <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
              {t('update.stayTuned')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
