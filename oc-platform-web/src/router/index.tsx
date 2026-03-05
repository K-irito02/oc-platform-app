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
const InfoPage = lazy(() => import('@/pages/InfoPage'));

const Error500 = lazy(() => import('@/pages/Error').then(m => ({ default: m.Error500 })));
const Error403 = lazy(() => import('@/pages/Error').then(m => ({ default: m.Error403 })));
const Maintenance = lazy(() => import('@/pages/Maintenance'));

const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const AdminUsers = lazy(() => import('@/pages/Admin/Users'));
const AdminProducts = lazy(() => import('@/pages/Admin/Products'));
const AdminProductEdit = lazy(() => import('@/pages/Admin/Products/ProductEdit'));
const AdminComments = lazy(() => import('@/pages/Admin/Comments'));
const AdminFeedbacks = lazy(() => import('@/pages/Admin/Feedbacks'));
const AdminCategories = lazy(() => import('@/pages/Admin/Categories'));
const AdminTheme = lazy(() => import('@/pages/Admin/Theme'));
const AdminSystem = lazy(() => import('@/pages/Admin/System'));

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
