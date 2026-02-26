import { lazy, Suspense, ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';

const LazyLoad = (Component: React.LazyExoticComponent<ComponentType<unknown>>) => (
  <Suspense fallback={<Spin size="large" className="flex justify-center mt-[30vh]" />}>
    <Component />
  </Suspense>
);

// 懒加载页面
const Home = lazy(() => import('@/pages/Home'));
const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Profile = lazy(() => import('@/pages/Profile'));
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ComingSoon = lazy(() => import('@/pages/ComingSoon'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const AdminUsers = lazy(() => import('@/pages/Admin/Users'));
const AdminProducts = lazy(() => import('@/pages/Admin/Products'));
const AdminComments = lazy(() => import('@/pages/Admin/Comments'));
const AdminCategories = lazy(() => import('@/pages/Admin/Categories'));
const AdminTheme = lazy(() => import('@/pages/Admin/Theme'));
const AdminSystem = lazy(() => import('@/pages/Admin/System'));

const router = createBrowserRouter([
  // Auth Routes (No Sidebar/Header, just Background)
  {
    path: '/login',
    element: LazyLoad(Login),
  },
  {
    path: '/register',
    element: LazyLoad(Register),
  },
  {
    path: '/forgot-password',
    element: LazyLoad(ForgotPassword),
  },
  
  // Main App Routes
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: LazyLoad(Home) },
      { path: 'products', element: LazyLoad(Products) },
      { path: 'products/:slug', element: LazyLoad(ProductDetail) },
      { path: 'profile', element: LazyLoad(Profile) },
      { path: 'developers', element: LazyLoad(ComingSoon) },
      { path: 'about', element: LazyLoad(ComingSoon) },
      { path: 'coming-soon', element: LazyLoad(ComingSoon) },
      { path: 'oauth/github/callback', element: LazyLoad(OAuthCallback) },
    ],
  },

  // Admin Routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: LazyLoad(AdminDashboard) },
      { path: 'users', element: LazyLoad(AdminUsers) },
      { path: 'products', element: LazyLoad(AdminProducts) },
      { path: 'comments', element: LazyLoad(AdminComments) },
      { path: 'categories', element: LazyLoad(AdminCategories) },
      { path: 'theme', element: LazyLoad(AdminTheme) },
      { path: 'system', element: LazyLoad(AdminSystem) },
    ],
  },

  // Fallback
  { path: '404', element: LazyLoad(NotFound) },
  { path: '*', element: <Navigate to="/404" replace /> },
]);

export default router;
