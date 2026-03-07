import { Shield } from 'lucide-react';

export function FilingInfo() {
  return (
    <div className="fixed bottom-0 left-0 right-0 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-slate-800">
      <div className="flex items-center justify-center">
        <a 
          href="https://beian.miit.gov.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200"
        >
          <Shield size={16} className="text-blue-500" />
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">黔ICP备2026002901号-1</span>
        </a>
      </div>
    </div>
  );
}
