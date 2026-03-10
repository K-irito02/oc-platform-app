import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Spin, Drawer } from 'antd';
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // 防止重复检查
    if (hasCheckedRef.current) return;
    
    // 检查认证状态
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // 检查用户角色
    if (user) {
      const roles = user.roles || [];
      const isAdmin = roles.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));
      
      if (!isAdmin) {
        navigate('/');
        return;
      }
      
      // 所有检查通过，标记为已检查并停止 loading
      hasCheckedRef.current = true;
      setChecking(false);
    }
  }, [user, isAuthenticated, navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Spin size="large"><span className="mt-4 text-slate-500">{t('common.loading')}</span></Spin>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={280}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
      >
        <AdminSidebar collapsed={false} setCollapsed={() => setMobileDrawerOpen(false)} />
      </Drawer>

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader 
          collapsed={collapsed} 
          setCollapsed={setCollapsed}
          onMenuClick={() => setMobileDrawerOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
