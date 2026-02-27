import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { useAppSelector } from '@/store/hooks';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Wait for auth state to be loaded from localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      
      if (user) {
        // Check roles. Handle case where roles might be undefined or empty
        const roles = user.roles || [];
        const isAdmin = roles.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));
        
        if (!isAdmin) {
          navigate('/');
          return;
        }
      }
      
      setChecking(false);
    }, 100); // Small delay to ensure auth state is loaded

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Spin size="large" tip={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
