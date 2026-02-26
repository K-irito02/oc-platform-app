import { useState, useEffect } from 'react';
import { Form, Input, Button, Tabs, message, Descriptions, Tag, Upload, Avatar, Card, Divider } from 'antd';
import { User, Lock, Edit, Upload as UploadIcon, Mail, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser, logout } from '@/store/slices/authSlice';
import { userApi, authApi } from '@/utils/api';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailCodeSending, setEmailCodeSending] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const res: any = await userApi.getProfile();
      const u = res.data;
      profileForm.setFieldsValue({ nickname: u.nickname, bio: u.bio });
      dispatch(setUser(u));
    } catch { /* handled */ }
  };

  const onProfileSave = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await userApi.updateProfile(values);
      dispatch(setUser(res.data));
      message.success(t('profile.profileUpdated'));
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const onPasswordChange = async (values: any) => {
    setLoading(true);
    try {
      await authApi.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      message.success(t('profile.passwordChanged'));
      dispatch(logout());
      navigate('/login');
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const sendEmailCode = async () => {
    // 先获取新邮箱值
    const newEmail = emailForm.getFieldValue('newEmail');
    if (!newEmail) {
      message.error(t('profile.pleaseEnterNewEmail'));
      return;
    }
    
    setEmailCodeSending(true);
    try {
      await authApi.sendChangeEmailCode({ newEmail });
      message.success(t('profile.emailCodeSent'));
      setEmailCountdown(60);
      const timer = setInterval(() => {
        setEmailCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error(error.response?.data?.message || t('profile.emailCodeSendFailed'));
    } finally {
      setEmailCodeSending(false);
    }
  };

  const onEmailChange = async (values: any) => {
    setLoading(true);
    try {
      await authApi.changeEmail({ code: values.code, newEmail: values.newEmail });
      message.success(t('profile.emailChanged'));
      dispatch(logout());
      navigate('/login');
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res: any = await userApi.uploadAvatar(formData);
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.nickname || user?.username}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>

          <Form.Item label={t('profile.nickname')} name="nickname">
            <Input size="large" placeholder={t('profile.nicknamePlaceholder')} />
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
              <Form.Item label={t('profile.newPassword')} name="newPassword" rules={[{ required: true, min: 8 }]}>
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
