export function FilingInfo() {
  return (
    <div className="fixed bottom-0 left-0 right-0 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-slate-800">
      <div className="flex items-center justify-center">
        <a 
          href="https://beian.miit.gov.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-500 dark:text-slate-400 text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          黔ICP备2026002901号-1
        </a>
      </div>
    </div>
  );
}
