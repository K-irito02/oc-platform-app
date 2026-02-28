import { useState } from 'react';
import { Form, Input } from 'antd';
import { message } from '@/utils/antdUtils';
import { GithubOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
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
      nickname?: string;
      avatarUrl?: string;
      roles: string[];
    };
    accessToken: string;
    refreshToken: string;
  };
}

interface GithubUrlResponse {
  data: {
    url: string;
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
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const res = await authApi.getGithubUrl() as GithubUrlResponse;
      window.location.href = res.data.url;
    } catch {
      message.error('Failed to get GitHub auth URL');
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

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-x-0 h-px bg-slate-300/50"></div>
            <span className="relative z-10 bg-white/50 px-3 text-xs font-medium text-slate-500 uppercase rounded-full">
                Or continue with
            </span>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-1 gap-4">
            <GlassButton 
                variant="secondary" 
                onClick={handleGithubLogin}
                className="w-full flex items-center justify-center gap-2"
            >
                <GithubOutlined className="text-xl" />
                <span>GitHub</span>
            </GlassButton>
        </div>

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

        {/* Dev Helpers */}
        {import.meta.env.DEV && (
            <div className="mt-8 p-4 rounded-xl bg-slate-100/50 border border-slate-200/50 text-xs">
                <p className="font-semibold text-slate-700 mb-2">Dev Quick Fill:</p>
                <div className="flex justify-between gap-2">
                    <button 
                        onClick={() => form.setFieldsValue({ email: 'admin@qtplatform.com', password: 'Admin@123456' })}
                        className="text-primary hover:underline cursor-pointer"
                    >
                        Admin
                    </button>
                    <button 
                        onClick={() => form.setFieldsValue({ email: 'zhangsan@example.com', password: 'Test@123456' })}
                        className="text-primary hover:underline cursor-pointer"
                    >
                        User
                    </button>
                </div>
            </div>
        )}
      </GlassCard>
    </div>
  );
}
