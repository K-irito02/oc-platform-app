import { useState, useEffect, useMemo } from 'react';
import { Form, Input, Button, Radio, Slider, Upload, message, Card, Select, ColorPicker, Space } from 'antd';
import { UploadOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/utils/api';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSystemConfig } from '@/store/slices/themeSlice';
import type { Color } from 'antd/es/color-picker';

// 预设字体选项 — 所有字体已在 index.css 中通过 Google Fonts / CDN 加载
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

// 预设笔画宽度选项
const STROKE_WIDTH_OPTIONS = [
  { label: '细 (1px)', value: '1px' },
  { label: '标准 (2px)', value: '2px' },
  { label: '粗 (3px)', value: '3px' },
  { label: '特粗 (4px)', value: '4px' },
];

export default function AdminTheme() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customFont, setCustomFont] = useState(false);
  const [customStrokeWidth, setCustomStrokeWidth] = useState(false);
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((s) => s.theme.currentTheme);

  // 实时表单值用于预览
  const watchPrimaryColor = Form.useWatch('primaryColor', form);
  const watchStrokeWidth = Form.useWatch('strokeWidth', form);
  const watchStrokeWidthCustom = Form.useWatch('strokeWidthCustom', form);
  const watchFontFamily = Form.useWatch('fontFamily', form);
  const watchFontFamilyCustom = Form.useWatch('fontFamilyCustom', form);
  const watchBgUrl = Form.useWatch('backgroundUrl', form);
  const watchBgType = Form.useWatch('backgroundType', form);
  const watchBgOpacity = Form.useWatch('backgroundOpacity', form);

  // 计算预览用的实际值
  const previewStrokeWidth = useMemo(() => {
    return watchStrokeWidth === 'custom' ? (watchStrokeWidthCustom || '2px') : (watchStrokeWidth || '2px');
  }, [watchStrokeWidth, watchStrokeWidthCustom]);
  const previewFontFamily = useMemo(() => {
    return watchFontFamily === 'custom' ? (watchFontFamilyCustom || 'serif') : (watchFontFamily || 'serif');
  }, [watchFontFamily, watchFontFamilyCustom]);

  useEffect(() => {
    loadThemeConfig();
  }, []);

  const loadThemeConfig = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getGlobalTheme();
      if (res.data && res.data.themeConfig) {
        let config = res.data.themeConfig;
        while (typeof config === 'string') {
          try { config = JSON.parse(config); } catch { break; }
        }
        if (config && config.themeConfig) {
          config = config.themeConfig;
          while (typeof config === 'string') {
            try { config = JSON.parse(config); } catch { break; }
          }
        }
        
        const strokeWidth = config.ink?.strokeWidth || '2px';
        const fontFamily = config.ink?.fontFamily || '"Ma Shan Zheng", cursive';
        const isPresetStroke = STROKE_WIDTH_OPTIONS.some(o => o.value === strokeWidth);
        const isPresetFont = FONT_OPTIONS.some(o => o.value === fontFamily);
        
        setCustomStrokeWidth(!isPresetStroke);
        setCustomFont(!isPresetFont);
        
        form.setFieldsValue({
          backgroundType: config.background?.type || 'image',
          backgroundUrl: config.background?.url || '',
          backgroundOpacity: config.background?.opacity ?? 0.1,
          primaryColor: config.ink?.primaryColor || '#8B0000',
          strokeWidth: isPresetStroke ? strokeWidth : 'custom',
          strokeWidthCustom: isPresetStroke ? '' : strokeWidth,
          fontFamily: isPresetFont ? fontFamily : 'custom',
          fontFamilyCustom: isPresetFont ? '' : fontFamily,
        });
      }
    } catch (e) {
      console.error('加载主题配置失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploading(true);
    try {
      // 使用 createObjectURL 创建真实可预览的 blob URL
      const blobUrl = URL.createObjectURL(file);
      form.setFieldValue('backgroundUrl', blobUrl);
      message.success(`文件 "${file.name}" 已加载`);
    } catch {
      message.error('文件加载失败');
    } finally {
      setUploading(false);
    }
  };

  const onSave = async (values: any) => {
    setLoading(true);
    try {
      const strokeWidth = values.strokeWidth === 'custom' 
        ? values.strokeWidthCustom || '2px' 
        : values.strokeWidth;
      const fontFamily = values.fontFamily === 'custom' 
        ? values.fontFamilyCustom || '"Ma Shan Zheng", cursive' 
        : values.fontFamily;
      
      const apiConfig = {
        background: {
          type: values.backgroundType,
          url: values.backgroundUrl,
          opacity: values.backgroundOpacity,
        },
        ink: {
          primaryColor: values.primaryColor,
          strokeWidth,
          fontFamily,
        },
      };
      await adminApi.updateGlobalTheme(JSON.stringify(apiConfig));
      dispatch(setSystemConfig({
        background: {
          type: values.backgroundType,
          url: values.backgroundUrl,
          opacity: values.backgroundOpacity,
          blur: currentTheme.background.blur,
        },
        appearance: {
          primaryColor: values.primaryColor,
          fontFamily,
          borderRadius: currentTheme.appearance.borderRadius,
          mode: currentTheme.appearance.mode,
        },
      }));
      message.success(t('theme.saveSuccess'));
    } catch {
      message.error(t('theme.saveFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--ink-darkest)', marginBottom: 4 }}>
          {t('theme.title')}
        </h2>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, margin: 0 }}>
          {t('theme.subtitle')}
        </p>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={onSave} style={{ maxWidth: 800 }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink-dark)', marginBottom: 16 }}>
            {t('theme.background')}
          </h3>
          
          <Form.Item label={t('theme.bgType')} name="backgroundType" initialValue="image">
            <Radio.Group>
              <Radio value="image">{t('theme.bgImage')}</Radio>
              <Radio value="video">{t('theme.bgVideo')}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label={t('theme.bgFile')}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="backgroundUrl" noStyle>
                <Input style={{ width: 'calc(100% - 90px)' }} placeholder={t('theme.bgUrlPlaceholder')} />
              </Form.Item>
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleFileUpload(file);
                  return false;
                }}
                accept="image/*,video/*"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>{t('theme.bgUpload')}</Button>
              </Upload>
            </Space.Compact>
            {/* 背景预览 */}
            {watchBgUrl && (
              <div style={{ marginTop: 8, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--ink-lightest)', maxHeight: 200 }}>
                {watchBgType === 'video' ? (
                  <video src={watchBgUrl} autoPlay loop muted playsInline style={{ width: '100%', maxHeight: 200, objectFit: 'cover', opacity: watchBgOpacity ?? 0.5 }} />
                ) : (
                  <div style={{ width: '100%', height: 150, backgroundImage: `url(${watchBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: watchBgOpacity ?? 0.5 }} />
                )}
              </div>
            )}
          </Form.Item>

          <Form.Item label={t('theme.bgOpacity')} name="backgroundOpacity" initialValue={0.1}>
            <Slider min={0} max={1} step={0.05} marks={{ 0: '0%', 0.5: '50%', 1: '100%' }} />
          </Form.Item>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink-dark)', marginTop: 32, marginBottom: 16 }}>
            {t('theme.inkStyle')}
          </h3>

          <Form.Item label={t('theme.primaryColor')} name="primaryColor" initialValue="#8B0000"
            getValueFromEvent={(color: Color) => (typeof color === 'string' ? color : color.toHexString())}
          >
            <ColorPicker showText format="hex" />
          </Form.Item>
          {/* 主色调预览条 */}
          <div style={{ marginTop: -16, marginBottom: 24 }}>
            <div style={{ height: 6, borderRadius: 3, background: watchPrimaryColor || '#8B0000', boxShadow: `0 0 8px ${watchPrimaryColor || '#8B0000'}44` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: watchPrimaryColor || '#8B0000', fontWeight: 600 }}>{t('theme.primaryColor')}: {watchPrimaryColor || '#8B0000'}</span>
            </div>
          </div>

          <Form.Item label={t('theme.strokeWidth')}>
            <Space>
              <Form.Item name="strokeWidth" initialValue="2px" noStyle>
                <Select
                  style={{ width: 150 }}
                  options={[
                    ...STROKE_WIDTH_OPTIONS,
                    { label: '自定义...', value: 'custom' },
                  ]}
                  onChange={(v) => setCustomStrokeWidth(v === 'custom')}
                />
              </Form.Item>
              {customStrokeWidth && (
                <Form.Item name="strokeWidthCustom" noStyle>
                  <Input placeholder="如: 5px" style={{ width: 100 }} />
                </Form.Item>
              )}
            </Space>
            {/* 笔画宽度预览 */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: previewStrokeWidth, background: 'var(--ink-dark)', borderRadius: 2, transition: 'height 0.3s' }} />
              <span style={{ fontSize: 12, color: 'var(--ink-light)', whiteSpace: 'nowrap' }}>{previewStrokeWidth}</span>
            </div>
          </Form.Item>

          <Form.Item label={t('theme.fontFamily')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="fontFamily" initialValue='"Ma Shan Zheng", cursive' noStyle>
                <Select
                  style={{ width: '100%' }}
                  options={[
                    ...FONT_OPTIONS,
                    { label: '自定义...', value: 'custom' },
                  ]}
                  onChange={(v) => setCustomFont(v === 'custom')}
                />
              </Form.Item>
              {customFont && (
                <Form.Item name="fontFamilyCustom" noStyle>
                  <Input placeholder='如: "Noto Sans SC", sans-serif' />
                </Form.Item>
              )}
            </Space>
            {/* 字体预览 */}
            <div style={{ marginTop: 8, padding: '12px 16px', background: 'var(--paper-warm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--ink-lightest)' }}>
              <div style={{ fontFamily: previewFontFamily, fontSize: 20, color: 'var(--ink-darkest)', lineHeight: 1.6 }}>
                墨韵悠然·水墨丹青
              </div>
              <div style={{ fontFamily: previewFontFamily, fontSize: 14, color: 'var(--ink-medium)', marginTop: 4 }}>
                Qt 产品发布平台 — 一站式软件分发服务 (Preview Font)
              </div>
            </div>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {t('theme.save')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                form.resetFields();
                loadThemeConfig();
              }}>
                {t('theme.reset')}
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
            <p style={{ margin: 0, marginBottom: 8 }}><strong>说明：</strong></p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>全局主题配置会作为所有用户的默认主题</li>
              <li>用户可以在个人设置中覆盖全局配置</li>
              <li>配置优先级：用户配置 &gt; 全局配置 &gt; 系统默认</li>
              <li>修改后立即生效，影响所有未自定义主题的用户</li>
            </ul>
          </div>
        </Form>
      </Card>
    </div>
  );
}
