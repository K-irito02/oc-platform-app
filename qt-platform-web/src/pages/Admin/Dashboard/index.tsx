import { useState, useEffect } from 'react';
import { Spin, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { User, Package, Download, MessageSquare, TrendingUp, Cloud } from 'lucide-react';
import { adminApi } from '@/utils/api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res: any = await adminApi.getDashboardStats();
      setStats(res.data);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Spin size="large" />
    </div>
  );

  const statCards = [
    { title: t('admin.totalUsers') || 'Total Users', value: stats?.totalUsers || 0, icon: <User size={24} />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { title: t('admin.totalProducts') || 'Total Products', value: stats?.totalProducts || 0, icon: <Package size={24} />, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { title: t('admin.totalDownloads') || 'Total Downloads', value: stats?.totalDownloads || 0, icon: <Download size={24} />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { title: t('admin.totalComments') || 'Comments', value: stats?.totalComments || 0, icon: <MessageSquare size={24} />, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
    { title: t('admin.newUsersToday') || 'New Users Today', value: stats?.newUsersToday || 0, icon: <TrendingUp size={24} />, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { title: t('admin.downloadsToday') || 'Downloads Today', value: stats?.downloadsToday || 0, icon: <Cloud size={24} />, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('admin.dashboard') || 'Dashboard'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">{t('admin.overviewDesc') || 'Overview of platform statistics'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">{card.title}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {stats?.downloadTrend && (
        <Card className="mt-8 border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            {t('admin.downloadTrend') || 'Download Trend'}
          </h3>
          <div className="flex items-end gap-2 h-40">
            {stats.downloadTrend.map((d: any, i: number) => {
              const max = Math.max(...stats.downloadTrend.map((t: any) => t.count));
              const h = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="text-xs text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</div>
                  <div 
                    className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max(h, 5)}%` }} 
                  />
                  <div className="text-xs text-slate-400 mt-2 truncate w-full text-center">{d.date}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
