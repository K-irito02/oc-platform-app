import { useTranslation } from 'react-i18next';
import { CircleDollarSign, Info, Sparkles } from 'lucide-react';

export default function InfoCards() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl blur-3xl"></div>
      
      {/* 免费声明 - 六边形设计 */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-blue-100 dark:border-blue-800/50 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 transition-all duration-500 transform hover:-translate-y-1">
          {/* 六边形装饰 */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <CircleDollarSign size={28} className="text-white" />
          </div>
          
          {/* 内容区域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {t('disclaimer.title')}
              </h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base font-medium">
              {t('disclaimer.content')}
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center">
                <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full border border-blue-200 dark:border-blue-700/50">
                {t('disclaimer.thirdParty')}
              </span>
            </div>
          </div>
          
          {/* 底部装饰线 */}
          <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
        </div>
      </div>

      {/* 更新说明 - 菱形设计 */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-800/50 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/30 transition-all duration-500 transform hover:-translate-y-1">
          {/* 菱形装饰 */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg transform rotate-45">
            <div className="transform -rotate-45">
              <Info size={28} className="text-white" />
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {t('update.title')}
              </h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base font-medium">
              {t('update.content')}
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-full border border-indigo-200 dark:border-indigo-700/50">
                {t('update.stayTuned')}
              </span>
            </div>
          </div>
          
          {/* 底部装饰线 */}
          <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
        </div>
      </div>
      
      {/* 连接线装饰 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-20 bg-gradient-to-b from-transparent via-blue-300 to-transparent opacity-20 hidden md:block"></div>
    </div>
  );
}
