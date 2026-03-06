import { useState } from 'react';
import { Form, Input, Button, Card } from 'antd';
import { message } from '@/utils/antdUtils';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { authApi } from '@/utils/api';
import { AuthPageToolbar } from '@/components/AuthPageToolbar';
import { SiteLogo } from '@/components/SiteLogo';
import { CloudflareTurnstile } from '@/components/CloudflareTurnstile';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';
import { useCountdown } from '@/hooks/useCountdown';

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  code: string;
  confirmPassword?: string;
};

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [form] = Form.useForm();
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const { config: captchaConfig } = useCaptchaConfig();
  const { countdown, start: startCountdown } = useCountdown(60);

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const sendCode = async () => {
    try {
      await form.validateFields(['email']);
      setCodeSending(true);
      const email = form.getFieldValue('email');
      await authApi.sendCode({ 
        email, 
        type: 'REGISTER',
        captchaToken: captchaToken
      });
      message.success(t('auth.codeSent') || 'Verification code sent');
      startCountdown();
    } catch (error) {
      console.error('Failed to send verification code:', error);
      message.error(t('auth.codeSendFailed') || 'Failed to send verification code');
    } finally {
      setCodeSending(false);
    }
  };

  const onFinish = async (values: RegisterFormValues) => {
    // 验证码启用但未完成验证时阻止提交
    if (captchaConfig.enabled && !captchaToken) {
      message.error(t('auth.captchaRequired') || '请完成验证码验证');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: values.username,
        email: values.email,
        password: values.password,
        verificationCode: values.code,
      });
      message.success(t('auth.registerSuccess') || 'Registration successful');
      navigate('/login');
    } catch {
      message.error(t('auth.registerFailed') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 py-20">
      <AuthPageToolbar />
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <SiteLogo size="lg" className="shadow-lg shadow-blue-600/20" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('auth.registerSubtitle')}</p>
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-2xl overflow-hidden">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
            className="p-4 md:p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Form.Item
                label={t('auth.username')}
                name="username"
                rules={[
                  { required: true, message: t('auth.usernameRequired') },
                  { min: 3, max: 50, message: t('auth.usernameLength') },
                  { pattern: /^[a-zA-Z0-9_-]+$/, message: t('auth.usernameFormat') }
                ]}
              >
                <Input prefix={<User size={18} className="text-slate-400 mr-2" />} placeholder="johndoe" />
              </Form.Item>

              <Form.Item
                label={t('auth.email')}
                name="email"
                rules={[{ required: true, type: 'email', message: t('auth.emailRequired') }]}
              >
                <Input prefix={<Mail size={18} className="text-slate-400 mr-2" />} placeholder="name@company.com" />
              </Form.Item>

              <Form.Item
                label={t('auth.verificationCode')}
                name="code"
                className="md:col-span-2"
                rules={[{ required: true, message: t('auth.codeRequired') }]}
              >
                <div className="flex gap-3">
                  <Input prefix={<ShieldCheck size={18} className="text-slate-400 mr-2" />} placeholder="123456" />
                  <Button 
                    onClick={sendCode} 
                    disabled={countdown > 0} 
                    loading={codeSending}
                    className="h-12 px-6"
                  >
                    {countdown > 0 ? `${countdown}s` : t('auth.sendCode')}
                  </Button>
                </div>
              </Form.Item>

              <Form.Item
                label={t('auth.password')}
                name="password"
                rules={[
                  { required: true, message: t('auth.passwordRequired') },
                  { min: 8, max: 64, message: t('auth.passwordLength') },
                  { pattern: /^[a-zA-Z0-9]+$/, message: t('auth.passwordFormat') }
                ]}
              >
                <Input.Password prefix={<Lock size={18} className="text-slate-400 mr-2" />} placeholder="••••••••" />
              </Form.Item>

              <Form.Item
                label={t('auth.confirmPassword')}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: t('auth.confirmPasswordRequired') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error(t('auth.passwordsNotMatch')));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<Lock size={18} className="text-slate-400 mr-2" />} placeholder="••••••••" />
              </Form.Item>
            </div>

            {/* Cloudflare Turnstile 验证码 */}
            {captchaConfig.enabled && captchaConfig.siteKey && (
              <div className="flex justify-center my-6">
                <CloudflareTurnstile
                  siteKey={captchaConfig.siteKey}
                  onVerify={handleCaptchaVerify}
                  theme="auto"
                  lang={i18n.language}
                />
              </div>
            )}

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="h-12 bg-blue-600 hover:bg-blue-700 border-none text-lg font-semibold mt-4"
            >
              {t('auth.createAccount')}
            </Button>
          </Form>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                {t('auth.loginNow')} <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
