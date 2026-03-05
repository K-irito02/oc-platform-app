import { useState } from 'react';
import { Form, Input } from 'antd';
import { message } from '@/utils/antdUtils';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { authApi } from '@/utils/api';

interface LoginResponse {
  data: {
    user: {
      id: number;
      email: string;
      username: string;
      avatarUrl?: string;
      roles: string[];
    };
    accessToken: string;
    refreshToken: string;
  };
}
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AuthPageToolbar } from '@/components/AuthPageToolbar';
import { SiteLogo } from '@/components/SiteLogo';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values) as LoginResponse;
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }));
      message.success(t('auth.loginSuccess') || '登录成功');
      navigate('/');
    } catch (error) {
      const err = error as Error & { code?: number };
      const errorCode = err.code;
      
      if (errorCode === 20009) {
        message.error(t('auth.userNotRegistered') || '该账号未注册，请先注册');
      } else if (errorCode === 20003) {
        message.error(t('auth.loginFailed') || '用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthPageToolbar />
      {/* Container */}
      <GlassCard className="w-full max-w-md p-8 sm:p-12 bg-white/60 backdrop-blur-xl border-white/40 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <SiteLogo size="xl" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
            {t('auth.welcomeBack') || 'Welcome Back'}
          </h1>
          <p className="text-slate-500">
            {t('auth.loginSubtitle') || 'Sign in to your account to continue'}
          </p>
        </div>

        {/* Form */}
        <Form 
            form={form} 
            name="login" 
            onFinish={onFinish} 
            autoComplete="off" 
            layout="vertical"
            size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: t('auth.emailRequired') || 'Please enter a valid email' }]}
            className="mb-5"
          >
            <Input 
                prefix={<MailOutlined className="text-slate-400" />} 
                placeholder={t('auth.email') || 'Email Address'} 
                className="glass-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth.passwordRequired') || 'Please enter your password' }]}
            className="mb-2"
          >
            <Input.Password 
                prefix={<LockOutlined className="text-slate-400" />} 
                placeholder={t('auth.password') || 'Password'} 
                className="glass-input"
            />
          </Form.Item>

          <div className="flex justify-end mb-8">
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('auth.forgotPassword') || 'Forgot password?'}
            </Link>
          </div>

          <Form.Item className="mb-6">
            <GlassButton 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-full h-12 text-lg"
                disabled={loading}
            >
                {loading ? 'Signing in...' : (t('common.login') || 'Sign In')}
            </GlassButton>
          </Form.Item>
        </Form>

        {/* Register Link */}
        <div className="mt-8 text-center text-sm text-slate-600">
            {t('auth.noAccount') || "Don't have an account?"} 
            <Link 
                to="/register" 
                className="ml-1 font-semibold text-primary hover:text-primary/80 transition-colors"
            >
                {t('auth.registerNow') || 'Sign up'}
            </Link>
        </div>
      </GlassCard>
    </div>
  );
}
