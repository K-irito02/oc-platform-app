import { useState, useRef } from 'react';
import { Form, Input } from 'antd';
import { message } from '@/utils/antdUtils';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { authApi } from '@/utils/api';
import { CloudflareTurnstile, resetTurnstile } from '@/components/CloudflareTurnstile';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';

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
import { FilingInfo } from '@/components/FilingInfo';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaError, setCaptchaError] = useState<string>('');
  const captchaRef = useRef<HTMLDivElement>(null);
  
  // 从后端动态获取验证码配置
  const { config: captchaConfig } = useCaptchaConfig();

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError('');
  };

  const onFinish = async () => {
    // 验证码验证状态检查
    if (captchaConfig.enabled && !captchaToken) {
      setCaptchaError(t('auth.captchaRequired') || '请完成验证码验证');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authApi.login({ 
        account: form.getFieldValue('account'),
        password: form.getFieldValue('password'),
        captchaToken: captchaToken
      }) as LoginResponse;
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }));
      message.success(t('auth.loginSuccess') || '登录成功');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { code?: number; response?: { data?: { message?: string } }; message?: string };
      const errorCode = err.code;
      const errorMsg = err.response?.data?.message || err.message || '';
      
      if (errorCode === 20009) {
        message.error(t('auth.userNotRegistered') || '该账号未注册，请先注册');
      } else if (errorCode === 20003) {
        message.error(t('auth.loginFailed') || '用户名或密码错误');
      } else if (errorMsg) {
        // 显示后端返回的具体错误信息
        message.error(errorMsg);
      } else {
        message.error(t('auth.loginFailed') || '登录失败，请稍后重试');
      }
      if (captchaRef.current) {
        resetTurnstile(captchaRef.current);
        setCaptchaToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthPageToolbar />
      <GlassCard className="w-full max-w-md p-8 sm:p-12 bg-white/60 backdrop-blur-xl border-white/40 shadow-2xl">
        
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

        <Form 
            form={form} 
            name="login" 
            onFinish={onFinish} 
            autoComplete="off" 
            layout="vertical"
            size="large"
        >
          <Form.Item
            name="account"
            rules={[
              { required: true, message: t('auth.accountRequired') || '请输入用户名或邮箱' },
              { 
                pattern: /^[a-zA-Z0-9_@.-]+$/, 
                message: t('auth.accountFormat') || '账号格式不正确' 
              }
            ]}
            className="mb-5"
          >
            <Input 
                prefix={<UserOutlined className="text-slate-400" />} 
                placeholder={t('auth.accountPlaceholder') || '用户名或邮箱'} 
                className="glass-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth.passwordRequired') || '请输入密码' }]}
            className="mb-2"
          >
            <Input.Password 
                prefix={<LockOutlined className="text-slate-400" />} 
                placeholder={t('auth.password') || '密码'} 
                className="glass-input"
            />
          </Form.Item>

          {/* 验证码组件 - 根据配置动态显示 */}
          {captchaConfig.enabled && (
            <div className="mb-6">
              {captchaConfig.siteKey ? (
                <div ref={captchaRef}>
                  <CloudflareTurnstile
                    siteKey={captchaConfig.siteKey}
                    onVerify={handleCaptchaVerify}
                    lang={i18n.language}
                  />
                  {captchaError && (
                    <div className="text-red-500 text-sm mt-2">{captchaError}</div>
                  )}
                </div>
              ) : (
                <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  {t('auth.captchaConfigError')}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mb-8">
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('auth.forgotPassword') || '忘记密码？'}
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
                {loading ? '登录中...' : (t('common.login') || '登录')}
            </GlassButton>
          </Form.Item>
        </Form>

        <div className="mt-8 text-center text-sm text-slate-600">
            {t('auth.noAccount') || "还没有账号？"} 
            <Link 
                to="/register" 
                className="ml-1 font-semibold text-primary hover:text-primary/80 transition-colors"
            >
                {t('auth.registerNow') || '立即注册'}
            </Link>
        </div>
      </GlassCard>
      <FilingInfo />
    </div>
  );
}
