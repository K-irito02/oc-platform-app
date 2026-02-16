import { useState, useEffect, useMemo } from 'react';
import { Form, Input, Button, Tabs, message, Descriptions, Tag, Upload, Radio, Slider, Space, Select, ColorPicker } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EditOutlined, BgColorsOutlined, UploadOutlined } from '@ant-design/icons';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser, logout } from '@/store/slices/authSlice';
import { setUserConfig } from '@/store/slices/themeSlice';
import { userApi, authApi } from '@/utils/api';
import type { Color } from 'antd/es/color-picker';

const FONT_OPTIONS = [
  { label: '马善政楷书', value: '"Ma Shan Zheng", cursive' },
  { label: '思源宋体', value: '"Noto Serif SC", serif' },
  { label: '霞鹜文楷', value: '"LXGW WenKai", cursive' },
  { label: '站酷仓耳渔阳体', value: '"ZCOOL XiaoWei", serif' },
  { label: '行书', value: '"Zhi Mang Xing", cursive' },
  { label: '草书', value: '"Liu Jian Mao Cao", cursive' },
  { label: '龙藏体', value: '"Long Cang", cursive' },
  { label: '系统默认', value: 'system-ui, sans-serif' },
];
const STROKE_WIDTH_OPTIONS = [
  { label: '细 (1px)', value: '1px' },
  { label: '标准 (2px)', value: '2px' },
  { label: '粗 (3px)', value: '3px' },
  { label: '特粗 (4px)', value: '4px' },
];

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [themeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const currentTheme = useAppSelector((s) => s.theme.currentTheme);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) {
      loadProfile();
      loadThemeConfig();
    }
  }, [isAuthenticated, user]);

  const loadProfile = async () => {
    try {
      const res: any = await userApi.getProfile();
      const u = res.data;
      profileForm.setFieldsValue({ nickname: u.nickname, bio: u.bio });
      dispatch(setUser(u));
    } catch { /* handled */ }
  };

  const loadThemeConfig = async () => {
    try {
      const res: any = await userApi.getTheme();
      if (res.data.themeConfig) {
        const config = JSON.parse(res.data.themeConfig);
        themeForm.setFieldsValue({
          backgroundType: config.background?.type || 'image',
          backgroundUrl: config.background?.url || '',
          backgroundOpacity: config.background?.opacity || 0.1,
        });
      }
    } catch { /* handled */ }
  };

  const onProfileSave = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await userApi.updateProfile(values);
      dispatch(setUser(res.data));
      message.success('资料已更新');
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const onPasswordChange = async (values: any) => {
    setLoading(true);
    try {
      await authApi.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      message.success('密码已修改，请重新登录');
      dispatch(logout());
      navigate('/login');
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const [customFont, setCustomFont] = useState(false);
  const [customStrokeWidth, setCustomStrokeWidth] = useState(false);

  const watchBgUrl = Form.useWatch('backgroundUrl', themeForm);
  const watchBgType = Form.useWatch('backgroundType', themeForm);
  const watchBgOpacity = Form.useWatch('backgroundOpacity', themeForm);
  const watchPrimaryColor = Form.useWatch('primaryColor', themeForm);
  const watchStrokeWidth = Form.useWatch('strokeWidth', themeForm);
  const watchStrokeWidthCustom = Form.useWatch('strokeWidthCustom', themeForm);
  const watchFontFamily = Form.useWatch('fontFamily', themeForm);
  const watchFontFamilyCustom = Form.useWatch('fontFamilyCustom', themeForm);

  const previewStrokeWidth = useMemo(() => {
    return watchStrokeWidth === 'custom' ? (watchStrokeWidthCustom || '2px') : (watchStrokeWidth || '2px');
  }, [watchStrokeWidth, watchStrokeWidthCustom]);
  const previewFontFamily = useMemo(() => {
    return watchFontFamily === 'custom' ? (watchFontFamilyCustom || 'serif') : (watchFontFamily || 'serif');
  }, [watchFontFamily, watchFontFamilyCustom]);

  const handleFileUpload = (file: File) => {
    setUploading(true);
    try {
      const blobUrl = URL.createObjectURL(file);
      themeForm.setFieldValue('backgroundUrl', blobUrl);
      message.success(`文件 "${file.name}" 已加载`);
    } catch {
      message.error('文件加载失败');
    } finally {
      setUploading(false);
    }
  };

  const onThemeSave = async (values: any) => {
    setLoading(true);
    try {
      const strokeWidth = values.strokeWidth === 'custom' ? (values.strokeWidthCustom || '2px') : values.strokeWidth;
      const fontFamily = values.fontFamily === 'custom' ? (values.fontFamilyCustom || '"Ma Shan Zheng", cursive') : values.fontFamily;
      const apiConfig = {
        background: {
          type: values.backgroundType,
          url: values.backgroundUrl,
          opacity: values.backgroundOpacity,
        },
        ink: {
          primaryColor: values.primaryColor || currentTheme.appearance.primaryColor,
          strokeWidth,
          fontFamily,
        },
      };
      await userApi.updateTheme(JSON.stringify(apiConfig));
      dispatch(setUserConfig({
        background: {
          type: values.backgroundType,
          url: values.backgroundUrl,
          opacity: values.backgroundOpacity,
          blur: currentTheme.background.blur,
        },
        appearance: {
          primaryColor: values.primaryColor || currentTheme.appearance.primaryColor,
          fontFamily,
          borderRadius: currentTheme.appearance.borderRadius,
          mode: currentTheme.appearance.mode,
        },
      }));
      message.success('外观设置已保存');
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const tabItems = [
    {
      key: 'profile',
      label: <span><EditOutlined /> 个人资料</span>,
      children: (
        <Form form={profileForm} layout="vertical" onFinish={onProfileSave}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <AvatarUpload
              currentAvatar={user?.avatarUrl || undefined}
              onUpload={async (blob, isGif) => {
                const formData = new FormData();
                formData.append('file', blob, isGif ? 'avatar.gif' : 'avatar.png');
                const res: any = await userApi.uploadAvatar(formData);
                if (res.data?.avatarUrl && user) {
                  dispatch(setUser({ ...user, avatarUrl: res.data.avatarUrl }));
                }
              }}
              size={88}
            />
            <div style={{ marginTop: 12, fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink-darkest)' }}>
              {user?.nickname || user?.username}
            </div>
            <div style={{ color: 'var(--ink-light)', fontSize: 13, marginTop: 4 }}>
              <MailOutlined /> {user?.email}
            </div>
          </div>
          <Form.Item label="昵称" name="nickname">
            <Input placeholder="昵称" style={{ borderRadius: 'var(--radius-md)' }} />
          </Form.Item>
          <Form.Item label="个人简介" name="bio">
            <Input.TextArea rows={3} placeholder="简单介绍一下自己" style={{ borderRadius: 'var(--radius-md)' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{
              background: 'var(--ink-dark)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
            }}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'account',
      label: <span><UserOutlined /> 账号信息</span>,
      children: (
        <Descriptions column={1} bordered size="small" style={{ maxWidth: 500 }}>
          <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="角色">
            {user?.roles?.map((r: string) => (
              <Tag key={r} color={r === 'SUPER_ADMIN' ? 'red' : r === 'ADMIN' ? 'orange' : 'blue'}>{r}</Tag>
            ))}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'password',
      label: <span><LockOutlined /> 修改密码</span>,
      children: (
        <Form form={passwordForm} layout="vertical" onFinish={onPasswordChange} style={{ maxWidth: 400 }}>
          <Form.Item label="当前密码" name="oldPassword" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--ink-lighter)' }} />} style={{ borderRadius: 'var(--radius-md)' }} />
          </Form.Item>
          <Form.Item label="新密码" name="newPassword" rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '至少 8 个字符' },
            { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, message: '需包含大小写字母和数字' },
          ]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--ink-lighter)' }} />} style={{ borderRadius: 'var(--radius-md)' }} />
          </Form.Item>
          <Form.Item label="确认新密码" name="confirmPassword" dependencies={['newPassword']} rules={[
            { required: true, message: '请确认' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('两次密码不一致'));
              },
            }),
          ]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--ink-lighter)' }} />} style={{ borderRadius: 'var(--radius-md)' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{
              background: 'var(--cinnabar)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
            }}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'appearance',
      label: <span><BgColorsOutlined /> 外观设置</span>,
      children: (
        <Form form={themeForm} layout="vertical" onFinish={onThemeSave} style={{ maxWidth: 600 }}>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--ink-dark)', marginBottom: 12 }}>背景设置</h4>
          <Form.Item label="背景类型" name="backgroundType" initialValue="image">
            <Radio.Group>
              <Radio value="image">图片</Radio>
              <Radio value="video">视频</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="背景文件">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="backgroundUrl" noStyle>
                <Input style={{ width: 'calc(100% - 90px)' }} placeholder="背景文件URL 或上传文件" />
              </Form.Item>
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleFileUpload(file);
                  return false;
                }}
                accept="image/*,video/*"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>上传</Button>
              </Upload>
            </Space.Compact>
            {watchBgUrl && (
              <div style={{ marginTop: 8, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--ink-lightest)', maxHeight: 160 }}>
                {watchBgType === 'video' ? (
                  <video src={watchBgUrl} autoPlay loop muted playsInline style={{ width: '100%', maxHeight: 160, objectFit: 'cover', opacity: watchBgOpacity ?? 0.5 }} />
                ) : (
                  <div style={{ width: '100%', height: 120, backgroundImage: `url(${watchBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: watchBgOpacity ?? 0.5 }} />
                )}
              </div>
            )}
          </Form.Item>
          <Form.Item label="背景透明度" name="backgroundOpacity" initialValue={0.1}>
            <Slider min={0} max={1} step={0.05} marks={{ 0: '0%', 0.5: '50%', 1: '100%' }} />
          </Form.Item>

          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--ink-dark)', marginTop: 24, marginBottom: 12 }}>水墨风格设置</h4>
          <Form.Item label="主色调" name="primaryColor" initialValue="#8B0000"
            getValueFromEvent={(color: Color) => (typeof color === 'string' ? color : color.toHexString())}
          >
            <ColorPicker showText format="hex" />
          </Form.Item>
          <div style={{ marginTop: -16, marginBottom: 24 }}>
            <div style={{ height: 6, borderRadius: 3, background: watchPrimaryColor || '#8B0000', boxShadow: `0 0 8px ${watchPrimaryColor || '#8B0000'}44` }} />
          </div>

          <Form.Item label="笔画宽度">
            <Space>
              <Form.Item name="strokeWidth" initialValue="2px" noStyle>
                <Select style={{ width: 150 }} options={[...STROKE_WIDTH_OPTIONS, { label: '自定义...', value: 'custom' }]} onChange={(v) => setCustomStrokeWidth(v === 'custom')} />
              </Form.Item>
              {customStrokeWidth && <Form.Item name="strokeWidthCustom" noStyle><Input placeholder="如: 5px" style={{ width: 100 }} /></Form.Item>}
            </Space>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: previewStrokeWidth, background: 'var(--ink-dark)', borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>预览: {previewStrokeWidth}</span>
            </div>
          </Form.Item>

          <Form.Item label="字体">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="fontFamily" initialValue='"Ma Shan Zheng", cursive' noStyle>
                <Select style={{ width: '100%' }} options={[...FONT_OPTIONS, { label: '自定义...', value: 'custom' }]} onChange={(v) => setCustomFont(v === 'custom')} />
              </Form.Item>
              {customFont && <Form.Item name="fontFamilyCustom" noStyle><Input placeholder='如: "Noto Sans SC", sans-serif' /></Form.Item>}
            </Space>
            <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--paper-warm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--ink-lightest)' }}>
              <div style={{ fontFamily: previewFontFamily, fontSize: 18, color: 'var(--ink-darkest)' }}>墨韵悠然·水墨丹青</div>
              <div style={{ fontFamily: previewFontFamily, fontSize: 13, color: 'var(--ink-medium)', marginTop: 2 }}>Qt 产品发布平台 (Preview)</div>
            </div>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} style={{
                background: 'var(--ink-dark)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
              }}>
                保存设置
              </Button>
              <Button onClick={() => {
                themeForm.resetFields();
                loadThemeConfig();
              }}>
                重置
              </Button>
            </div>
          </Form.Item>
          <div style={{ 
            marginTop: 24, 
            padding: 16, 
            background: 'var(--paper-warm)', 
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--ink-light)'
          }}>
            <p style={{ margin: 0, marginBottom: 8 }}><strong>提示：</strong></p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>支持上传图片（JPG/PNG/WebP/SVG）或视频（MP4/WebM）作为背景</li>
              <li>背景透明度越高，背景越明显</li>
              <li>个人设置会覆盖全局默认主题</li>
            </ul>
          </div>
        </Form>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 4 }}>个人中心</h2>
        <p style={{ color: 'var(--ink-light)', fontSize: 14, margin: 0 }}>管理您的个人信息和账号安全</p>
      </div>
      <div className="paper-card" style={{ padding: '28px 32px' }}>
        <Tabs items={tabItems} />
      </div>
    </div>
  );
}
