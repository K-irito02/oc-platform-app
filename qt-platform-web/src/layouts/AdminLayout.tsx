import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Header } from '@/components/layout/Header';
import { useAppSelector } from '@/store/hooks';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentTheme } = useAppSelector((state) => state.theme);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait for user data to load before checking roles
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // If authenticated but user not loaded yet, wait
    if (!user) {
      return;
    }
    
    // User loaded, check admin role
    const isAdmin = user.roles?.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));
    if (!isAdmin) {
      navigate('/');
    } else {
      setChecking(false);
    }
  }, [user, isAuthenticated, navigate]);

  // Show loading while checking permissions
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full relative bg-slate-900/10 transition-colors duration-500">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10">
        <Header />
        
        <div className="flex-1 px-8 pb-8 pt-2 overflow-y-auto custom-scrollbar">
          <div
            className="glass-panel rounded-3xl min-h-full p-8 backdrop-blur-xl border-white/20 shadow-none transition-colors duration-300"
            style={{ backgroundColor: `rgba(255, 255, 255, ${Math.min(currentTheme.background.opacity + 0.1, 1)})` }}
          >
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
