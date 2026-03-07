import { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Input, Button, Tabs, Descriptions, Tag, Upload, Avatar, Card, Divider } from 'antd';
import { message } from '@/utils/antdUtils';
import { User, Lock, Edit, Upload as UploadIcon, Mail, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser, logout } from '@/store/slices/authSlice';
import { userApi, authApi } from '@/utils/api';
import { CloudflareTurnstile, resetTurnstile } from '@/components/CloudflareTurnstile';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';
import { useCountdown } from '@/hooks/useCountdown';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
  roles?: string[];
  bio?: string | null;
};

type ProfileFormValues = {
  username?: string;
  bio?: string;
};

type EmailFormValues = {
  newEmail: string;
  code: string;
};

type ApiResponse<T> = {
  data: T;
};

type UploadAvatarResponse = {
  avatarUrl?: string;
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailCodeSending, setEmailCodeSending] = useState(false);
  
  const [passwordCaptchaToken, setPasswordCaptchaToken] = useState<string>('');
  const [passwordCaptchaVerified, setPasswordCaptchaVerified] = useState(false);
  const [emailCaptchaToken, setEmailCaptchaToken] = useState<string>('');
  const [emailCaptchaVerified, setEmailCaptchaVerified] = useState(false);
  
  const passwordCaptchaRef = useRef<HTMLDivElement>(null);
  const emailCaptchaRef = useRef<HTMLDivElement>(null);
  
  // 使用 useCaptchaConfig Hook 获取验证码配置
  const { config: captchaConfig } = useCaptchaConfig();
  // 使用 useCountdown Hook 管理邮箱验证码倒计时
  const { countdown: emailCountdown, start: startEmailCountdown } = useCountdown(60);

  const loadProfile = useCallback(async () => {
    try {
      const res = await userApi.getProfile() as ApiResponse<UserProfile>;
      const u = res.data;
      if (u) {
        profileForm.setFieldsValue({ username: u.username, bio: u.bio || '' });
        dispatch(setUser(u));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, [dispatch, profileForm]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadProfile();
  }, [isAuthenticated, navigate, loadProfile]);

  const onProfileSave = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const res = await userApi.updateProfile(values) as ApiResponse<UserProfile>;
      if (res.data) dispatch(setUser(res.data));
      message.success(t('profile.profileUpdated'));
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = err.response?.data?.message || err.message || '';
      if (errorMsg) {
        message.error(errorMsg);
      } else {
        message.error(t('profile.profileUpdateFailed') || 'Failed to update profile');
      }
    } finally { setLoading(false); }
  };

  const handlePasswordCaptchaVerify = (token: string) => {
    setPasswordCaptchaToken(token);
    setPasswordCaptchaVerified(true);
  };

  const handleEmailCaptchaVerify = (token: string) => {
    setEmailCaptchaToken(token);
    setEmailCaptchaVerified(true);
  };

  const onPasswordChange = async () => {
    // 验证码检查
    if (captchaConfig.enabled && !passwordCaptchaVerified) {
      message.error(t('profile.captchaRequired'));
      return;
    }
    
    setLoading(true);
    try {
      const values = passwordForm.getFieldsValue();
      await authApi.changePassword({ 
        oldPassword: values.oldPassword, 
        newPassword: values.newPassword,
        captchaToken: passwordCaptchaToken
      });
      message.success(t('profile.passwordChanged'));
      dispatch(logout());
      navigate('/login');
    } catch (error: unknown) {
      console.error('Failed to change password:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = err.response?.data?.message || err.message || '';
      if (errorMsg) {
        message.error(errorMsg);
      } else {
        message.error(t('profile.passwordChangeFailed') || 'Failed to change password');
      }
      if (passwordCaptchaRef.current) {
        resetTurnstile(passwordCaptchaRef.current);
        setPasswordCaptchaVerified(false);
        setPasswordCaptchaToken('');
      }
    } finally { setLoading(false); }
  };

  const sendEmailCode = async () => {
    // 验证码检查
    if (captchaConfig.enabled && !emailCaptchaVerified) {
      message.error(t('profile.captchaRequired'));
      return;
    }
    
    // 先获取新邮箱值
    const newEmail = emailForm.getFieldValue('newEmail');
    if (!newEmail) {
      message.error(t('profile.pleaseEnterNewEmail'));
      return;
    }
    
    setEmailCodeSending(true);
    try {
      await authApi.sendChangeEmailCode({ 
        newEmail,
        captchaToken: emailCaptchaToken
      });
      message.success(t('profile.emailCodeSent'));
      startEmailCountdown();
    } catch (error: unknown) {
      console.error('Failed to send email verification code:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || t('profile.emailCodeSendFailed'));
      if (emailCaptchaRef.current) {
        resetTurnstile(emailCaptchaRef.current);
        setEmailCaptchaVerified(false);
        setEmailCaptchaToken('');
      }
    } finally {
      setEmailCodeSending(false);
    }
  };

  const onEmailChange = async (values: EmailFormValues) => {
    setLoading(true);
    try {
      await authApi.changeEmail({ code: values.code, newEmail: values.newEmail });
      message.success(t('profile.emailChanged'));
      dispatch(logout());
      navigate('/login');
    } catch (error: unknown) {
      console.error('Failed to change email:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = err.response?.data?.message || err.message || '';
      if (errorMsg) {
        message.error(errorMsg);
      } else {
        message.error(t('profile.emailChangeFailed') || 'Failed to change email');
      }
    } finally { setLoading(false); }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await userApi.uploadAvatar(formData) as ApiResponse<UploadAvatarResponse>;
      if (res.data?.avatarUrl && user) {
        const avatarUrlWithCacheBuster = `${res.data.avatarUrl}?t=${Date.now()}`;
        dispatch(setUser({ ...user, avatarUrl: avatarUrlWithCacheBuster }));
        message.success(t('avatar.uploadSuccess'));
      }
    } catch {
      message.error(t('avatar.uploadFail'));
    }
    return false;
  };

  const tabItems = [
    {
      key: 'profile',
      label: <span className="flex items-center gap-2"><Edit size={16} /> {t('profile.editProfile')}</span>,
      children: (
        <Form form={profileForm} layout="vertical" onFinish={onProfileSave} className="max-w-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <Avatar 
                src={user?.avatarUrl} 
                size={100} 
                className="bg-blue-600 text-2xl mb-4 border-4 border-white dark:border-slate-800 shadow-lg"
              >
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Upload 
                showUploadList={false} 
                beforeUpload={handleAvatarUpload}
                className="absolute bottom-4 right-0"
              >
                <Button 
                  shape="circle" 
                  size="small" 
                  icon={<UploadIcon size={14} />} 
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm" 
                />
              </Upload>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.username}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>

          <Form.Item 
            label={t('profile.username')} 
            name="username"
            rules={[
              { min: 3, max: 50, message: t('profile.usernameLength') },
              { pattern: /^[a-zA-Z0-9_-]*$/, message: t('profile.usernamePattern') }
            ]}
          >
            <Input size="large" placeholder={t('profile.usernamePlaceholder')} />
          </Form.Item>
          
          <Form.Item label={t('profile.bio')} name="bio">
            <Input.TextArea rows={4} placeholder={t('profile.bioPlaceholder')} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" className="bg-blue-600">
              {t('profile.saveChanges')}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'account',
      label: <span className="flex items-center gap-2"><User size={16} /> {t('profile.accountInfo')}</span>,
      children: (
        <Descriptions column={1} bordered className="max-w-lg bg-white dark:bg-slate-900">
          <Descriptions.Item label={t('profile.username')}>{user?.username}</Descriptions.Item>
          <Descriptions.Item label={t('profile.email')}>{user?.email}</Descriptions.Item>
          <Descriptions.Item label={t('profile.roles')}>
            {user?.roles?.map((r: string) => (
              <Tag key={r} color="blue">{r}</Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.userId')}>{user?.id}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'security',
      label: <span className="flex items-center gap-2"><Lock size={16} /> {t('profile.security')}</span>,
      children: (
        <div className="max-w-md space-y-8">
          {/* Change Password Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Lock size={18} /> {t('profile.changePasswordTitle')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('profile.changePasswordDesc')}</p>
            <Form form={passwordForm} layout="vertical" onFinish={onPasswordChange}>
              <Form.Item label={t('profile.currentPassword')} name="oldPassword" rules={[{ required: true }]}>
                <Input.Password size="large" prefix={<Lock size={16} className="text-slate-400" />} />
              </Form.Item>
              <Form.Item label={t('profile.newPassword')} name="newPassword" rules={[
                { required: true, message: t('auth.passwordRequired') },
                { min: 8, max: 64, message: t('auth.passwordLength') },
                { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, message: t('auth.passwordFormat') }
              ]}>
                <Input.Password size="large" prefix={<Lock size={16} className="text-slate-400" />} />
              </Form.Item>
              <Form.Item label={t('profile.confirmNewPassword')} name="confirmPassword" dependencies={['newPassword']} rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error(t('profile.passwordsNotMatch')));
                  },
                }),
              ]}>
                <Input.Password size="large" prefix={<Lock size={16} className="text-slate-400" />} />
              </Form.Item>
              {/* 验证码组件 */}
              {captchaConfig.enabled && (
                <Form.Item label={t('profile.captcha')} required>
                  {captchaConfig.siteKey ? (
                    <div ref={passwordCaptchaRef}>
                      <CloudflareTurnstile
                        siteKey={captchaConfig.siteKey}
                        onVerify={handlePasswordCaptchaVerify}
                        lang={i18n.language}
                      />
                    </div>
                  ) : (
                    <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      {t('profile.captchaConfigError')}
                    </div>
                  )}
                </Form.Item>
              )}
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} size="large" danger>
                  {t('profile.changePasswordBtn')}
                </Button>
              </Form.Item>
            </Form>
          </div>

          <Divider />

          {/* Change Email Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Mail size={18} /> {t('profile.changeEmailTitle')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('profile.changeEmailDesc')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('profile.currentEmail')}: <strong className="text-slate-700 dark:text-slate-200">{user?.email}</strong>
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <Info size={16} className="inline mr-1" />
                {t('profile.changeEmailNote')}
              </p>
            </div>
            <Form form={emailForm} layout="vertical" onFinish={onEmailChange}>
              <Form.Item
                label={t('profile.newEmail')}
                name="newEmail"
                rules={[
                  { required: true, message: t('profile.newEmailRequired') },
                  { type: 'email', message: t('profile.emailFormatError') },
                ]}
              >
                <Input size="large" prefix={<Mail size={16} className="text-slate-400" />} placeholder={t('profile.newEmailPlaceholder')} />
              </Form.Item>
              {/* 验证码组件 */}
              {captchaConfig.enabled && (
                <Form.Item label={t('profile.captcha')} required>
                  {captchaConfig.siteKey ? (
                    <div ref={emailCaptchaRef}>
                      <CloudflareTurnstile
                        siteKey={captchaConfig.siteKey}
                        onVerify={handleEmailCaptchaVerify}
                        lang={i18n.language}
                      />
                    </div>
                  ) : (
                    <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      {t('profile.captchaConfigError')}
                    </div>
                  )}
                </Form.Item>
              )}
              <Form.Item label={t('profile.verificationCode')} name="code" rules={[{ required: true, message: t('profile.codeRequired') }]}>
                <div className="flex gap-3">
                  <Input size="large" prefix={<ShieldCheck size={16} className="text-slate-400" />} placeholder="123456" />
                  <Button
                    size="large"
                    onClick={sendEmailCode}
                    disabled={emailCountdown > 0}
                    loading={emailCodeSending}
                    className="shrink-0"
                  >
                    {emailCountdown > 0 ? `${emailCountdown}s` : t('profile.sendCode')}
                  </Button>
                </div>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} size="large" className="bg-blue-600">
                  {t('profile.changeEmailBtn')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('profile.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('profile.subtitle')}</p>
      </div>
      
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <Tabs items={tabItems} defaultActiveKey="profile" />
      </Card>
    </div>
  );
}
