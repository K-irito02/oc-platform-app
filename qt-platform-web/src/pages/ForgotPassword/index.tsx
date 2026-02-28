import { useState } from 'react';
import { Form, Input, Button, Typography, Space, Steps } from 'antd';
import { message } from '@/utils/antdUtils';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/utils/api';
import { AuthPageToolbar } from '@/components/AuthPageToolbar';
import { SiteLogo } from '@/components/SiteLogo';

const { Paragraph } = Typography;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const [form] = Form.useForm();

  const sendCode = async () => {
    const emailVal = form.getFieldValue('email');
    if (!emailVal) { message.warning(t('auth.emailRequired')); return; }
    setCodeSending(true);
    try {
      await authApi.sendCode({ email: emailVal, type: 'RESET_PASSWORD' });
      message.success(t('auth.codeSent'));
      setEmail(emailVal);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((p) => { if (p <= 1) { clearInterval(timer); return 0; } return p - 1; });
      }, 1000);
      setStep(1);
    } catch { /* handled */ } finally { setCodeSending(false); }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code: values.code, newPassword: values.newPassword });
      message.success(t('auth.resetSuccess'));
      navigate('/login');
    } catch { /* handled */ } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AuthPageToolbar />
      <div className="paper-card animate-ink-spread" style={{ width: '100%', maxWidth: 420, padding: '44px 40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="flex justify-center mb-4">
            <SiteLogo size="lg" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--ink-darkest)', letterSpacing: '0.08em', marginBottom: 8 }}>
            {t('auth.resetPasswordTitle')}
          </h2>
          <Paragraph style={{ color: 'var(--ink-light)', fontSize: 14, marginBottom: 0 }}>
            {t('auth.resetPasswordDesc')}
          </Paragraph>
        </div>

        <Steps current={step} size="small" style={{ marginBottom: 28 }}
          items={[{ title: t('auth.stepVerifyEmail') }, { title: t('auth.stepSetPassword') }]} />

        <Form form={form} onFinish={step === 0 ? undefined : onFinish} size="large" layout="vertical">
          {step === 0 && (
            <>
              <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('auth.emailRequired') }]}>
                <Input prefix={<MailOutlined style={{ color: 'var(--ink-lighter)' }} />} placeholder={t('auth.emailPlaceholder')} style={{ borderRadius: 'var(--radius-md)' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" block loading={codeSending} onClick={sendCode} style={{
                  height: 44, fontWeight: 500, borderRadius: 'var(--radius-md)', background: 'var(--ink-dark)', border: 'none',
                }}>
                  {t('auth.sendCode')}
                </Button>
              </Form.Item>
            </>
          )}
          {step === 1 && (
            <>
              <Form.Item name="code" rules={[{ required: true, message: t('auth.codeRequired') }]}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input prefix={<SafetyOutlined style={{ color: 'var(--ink-lighter)' }} />} placeholder={t('auth.codePlaceholder')} style={{ flex: 1, borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }} />
                  <Button onClick={sendCode} disabled={countdown > 0} loading={codeSending} style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                    {countdown > 0 ? `${countdown}s` : t('auth.resend')}
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item name="newPassword" rules={[
                { required: true, message: t('auth.newPasswordRequired') },
                { min: 8, message: t('auth.passwordMin8') },
                { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, message: t('auth.passwordPattern') },
              ]}>
                <Input.Password prefix={<LockOutlined style={{ color: 'var(--ink-lighter)' }} />} placeholder={t('auth.newPasswordPlaceholder')} style={{ borderRadius: 'var(--radius-md)' }} />
              </Form.Item>
              <Form.Item name="confirmPassword" dependencies={['newPassword']} rules={[
                { required: true, message: t('auth.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error(t('auth.passwordsNotMatch')));
                  },
                }),
              ]}>
                <Input.Password prefix={<LockOutlined style={{ color: 'var(--ink-lighter)' }} />} placeholder={t('auth.confirmPasswordPlaceholder')} style={{ borderRadius: 'var(--radius-md)' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} style={{
                  height: 44, fontWeight: 500, borderRadius: 'var(--radius-md)', background: 'var(--ink-dark)', border: 'none',
                }}>
                  {t('auth.resetPasswordBtn')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form>

        <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--ink-lightest)' }}>
          <Link to="/login" style={{ color: 'var(--indigo)', fontSize: 14 }}>← {t('auth.backToLogin')}</Link>
        </div>
      </div>
    </div>
  );
}
