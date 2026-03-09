import { lazy, Suspense, ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';

const lazyLoad = (Component: React.LazyExoticComponent<ComponentType<unknown>>) => (
  <Suspense fallback={<Spin size="large" className="flex justify-center mt-[30vh]" />}>
    <Component />
  </Suspense>
);

const lazyWithRetry = (importFn: () => Promise<{ default: ComponentType<unknown> }>) => {
  return lazy(() => {
    return importFn().catch(async (error) => {
      const chunkId = importFn.toString().slice(0, 100);
      const retryKey = `chunk-retry-${chunkId}`;
      const hasRetried = sessionStorage.getItem(retryKey);
      
      if (!hasRetried) {
        sessionStorage.setItem(retryKey, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      
      sessionStorage.removeItem(retryKey);
      throw error;
    });
  });
};

const Home = lazyWithRetry(() => import('@/pages/Home'));
const Products = lazyWithRetry(() => import('@/pages/Products'));
const ProductDetail = lazyWithRetry(() => import('@/pages/ProductDetail'));
const Login = lazyWithRetry(() => import('@/pages/Login'));
const Register = lazyWithRetry(() => import('@/pages/Register'));
const ForgotPassword = lazyWithRetry(() => import('@/pages/ForgotPassword'));
const Profile = lazyWithRetry(() => import('@/pages/Profile'));
const OAuthCallback = lazyWithRetry(() => import('@/pages/OAuthCallback'));
const NotFound = lazyWithRetry(() => import('@/pages/NotFound'));
const ComingSoon = lazyWithRetry(() => import('@/pages/ComingSoon'));
const InfoPage = lazyWithRetry(() => import('@/pages/InfoPage'));

const Error500 = lazyWithRetry(() => import('@/pages/Error').then(m => ({ default: m.Error500 })));
const Error403 = lazyWithRetry(() => import('@/pages/Error').then(m => ({ default: m.Error403 })));
const Maintenance = lazyWithRetry(() => import('@/pages/Maintenance'));

const AdminDashboard = lazyWithRetry(() => import('@/pages/Admin/Dashboard'));
const AdminUsers = lazyWithRetry(() => import('@/pages/Admin/Users'));
const AdminProducts = lazyWithRetry(() => import('@/pages/Admin/Products'));
const AdminProductEdit = lazyWithRetry(() => import('@/pages/Admin/Products/ProductEdit'));
const AdminComments = lazyWithRetry(() => import('@/pages/Admin/Comments'));
const AdminFeedbacks = lazyWithRetry(() => import('@/pages/Admin/Feedbacks'));
const AdminCategories = lazyWithRetry(() => import('@/pages/Admin/Categories'));
const AdminTheme = lazyWithRetry(() => import('@/pages/Admin/Theme'));
const AdminSystem = lazyWithRetry(() => import('@/pages/Admin/System'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: lazyLoad(Login),
  },
  {
    path: '/register',
    element: lazyLoad(Register),
  },
  {
    path: '/forgot-password',
    element: lazyLoad(ForgotPassword),
  },
  
  {
    path: '/maintenance',
    element: lazyLoad(Maintenance),
  },
  {
    path: '/500',
    element: lazyLoad(Error500),
  },
  {
    path: '/403',
    element: lazyLoad(Error403),
  },
  
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: lazyLoad(Home) },
      { path: 'products', element: lazyLoad(Products) },
      { path: 'products/:slug', element: lazyLoad(ProductDetail) },
      { path: 'profile', element: lazyLoad(Profile) },
      { path: 'developers', element: lazyLoad(ComingSoon) },
      { path: 'about', element: lazyLoad(InfoPage) },
      { path: 'privacy', element: lazyLoad(InfoPage) },
      { path: 'terms', element: lazyLoad(InfoPage) },
      { path: 'changelog', element: lazyLoad(InfoPage) },
      { path: 'coming-soon', element: lazyLoad(ComingSoon) },
      { path: 'oauth/github/callback', element: lazyLoad(OAuthCallback) },
    ],
  },

  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: lazyLoad(AdminDashboard) },
      { path: 'users', element: lazyLoad(AdminUsers) },
      { path: 'products', element: lazyLoad(AdminProducts) },
      { path: 'products/new', element: lazyLoad(AdminProductEdit) },
      { path: 'products/:id/edit', element: lazyLoad(AdminProductEdit) },
      { path: 'comments', element: lazyLoad(AdminComments) },
      { path: 'feedbacks', element: lazyLoad(AdminFeedbacks) },
      { path: 'categories', element: lazyLoad(AdminCategories) },
      { path: 'theme', element: lazyLoad(AdminTheme) },
      { path: 'system', element: lazyLoad(AdminSystem) },
    ],
  },

  { path: '404', element: lazyLoad(NotFound) },
  { path: '*', element: <Navigate to="/404" replace /> },
]);

export default router;
